/**
 * MAIN.JS - Painéis, Justificativas, Cadastro e Controle de Abas
 */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('calc-n1')) {
    calculateIFCalc();
  }
});

function loadAlunoDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';
  
  const student = activeSession.data;
  document.getElementById('portal-tabs-container').innerHTML = `
    <button class="portal-tab-btn active" onclick="switchPortalTab('tab-boletim', this)"><i class="fa-solid fa-graduation-cap"></i> Meu Boletim & Faltas</button>
    <button class="portal-tab-btn" onclick="switchPortalTab('tab-justificativa', this)"><i class="fa-solid fa-file-medical"></i> Justificar Faltas</button>
  `;

  renderAlunoDashboardContent();
}

function renderAlunoDashboardContent() {
  const student = activeSession.data;
  document.getElementById('tab-content-area').innerHTML = `
    <div class="portal-tab-content active" id="tab-boletim">
      <h3>Boletim Escolar de ${student.name} (${student.turma})</h3>
      <p style="margin-bottom:15px; color:#555;">Matrícula: <strong>${student.matricula}</strong></p>
      <div class="table-responsive">
        <table class="dwu-table">
          <thead><tr><th>Disciplina</th><th>1º Bim</th><th>2º Bim</th><th>3º Bim</th><th>4º Bim</th><th>Média</th><th>Faltas (Qtd)</th><th>Situação</th></tr></thead>
          <tbody>
            ${student.disciplines.map(d => {
              const count = [d.n1, d.n2, d.n3, d.n4].filter(n => n !== null).length;
              const media = calculatePartialAverage(d.n1, d.n2, d.n3, d.n4);
              const status = getStudentStatus(parseFloat(media), count);
              return `<tr><td><strong>${d.name}</strong></td><td>${d.n1??'--'}</td><td>${d.n2??'--'}</td><td>${d.n3??'--'}</td><td>${d.n4??'--'}</td><td><strong>${media}</strong></td><td>${d.faltas} falta(s)</td><td><span class="badge-status ${status.class}">${status.label}</span></td></tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="portal-tab-content" id="tab-justificativa">
      <h3>Justificativa de Faltas / Atestado Médico</h3>
      <p style="color:#666; margin-bottom:15px;">Envie o atestado ou o motivo da ausência para análise dos professores e da coordenação.</p>
      <form class="dwu-form" onsubmit="handleStudentJustificativa(event)">
        <div class="form-group"><label>Data da Ausência</label><input type="date" id="just-data" required></div>
        <div class="form-group"><label>Anexar Atestado / Comprovante (Imagem/PDF)</label><input type="file" id="just-file" required accept="image/*,.pdf"></div>
        <div class="form-group"><label>Motivo da Falta</label><textarea id="just-motivo" rows="3" required placeholder="Explique o motivo da ausência..."></textarea></div>
        <button type="submit" class="btn-dwu-apply" style="border:none; cursor:pointer;">Enviar Justificativa</button>
      </form>

      <div style="margin-top: 30px;">
        <h4 style="color: var(--dwu-navy); margin-bottom: 10px;">Histórico de Justificativas Enviadas</h4>
        <ul style="list-style: none; padding: 0;">
          ${(student.justificativas && student.justificativas.length > 0) ? student.justificativas.map(j => `
            <li style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 10px; border-radius: 4px; margin-bottom: 8px;">
              <strong>Data:</strong> ${j.data} | <strong>Motivo:</strong> ${j.motivo} <br>
              <span style="color: #22C55E; font-size: 0.85rem; font-weight: bold;"><i class="fa-solid fa-circle-check"></i> Recebido pelos professores</span>
            </li>
          `).join('') : '<p style="font-size: 0.85rem; color: #777;">Nenhuma justificativa enviada recentemente.</p>'}
        </ul>
      </div>
    </div>
  `;
}

function handleStudentJustificativa(event) {
  event.preventDefault();
  const data = document.getElementById('just-data').value;
  const motivo = document.getElementById('just-motivo').value;

  if (!activeSession.data.justificativas) {
    activeSession.data.justificativas = [];
  }

  activeSession.data.justificativas.push({ data, motivo });
  
  const studentInDB = systemDB.students.find(s => s.matricula === activeSession.data.matricula);
  if (studentInDB) {
    studentInDB.justificativas = activeSession.data.justificativas;
    saveSystemData();
  }

  alert("Justificativa enviada com sucesso para os professores!");
  renderAlunoDashboardContent();
}

function loadProfessorDashboard() {
  document.getElementById('login-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';

  const prof = activeSession.data;
  document.getElementById('portal-tabs-container').innerHTML = `
    <button class="portal-tab-btn active" onclick="switchPortalTab('tab-diario', this)"><i class="fa-solid fa-pen-to-square"></i> Lançar Notas (${prof.subjectName})</button>
    <button class="portal-tab-btn" onclick="switchPortalTab('tab-justificativas-prof', this)"><i class="fa-solid fa-envelope-open-text"></i> Justificativas Recebidas</button>
    <button class="portal-tab-btn" onclick="switchPortalTab('tab-cadastro', this)"><i class="fa-solid fa-user-plus"></i> Cadastrar Novo Aluno</button>
  `;

  renderProfessorDiario(prof);
}

function renderProfessorDiario(prof) {
  let todasJustificativas = [];
  systemDB.students.forEach(st => {
    if (st.justificativas && st.justificativas.length > 0) {
      st.justificativas.forEach(j => {
        todasJustificativas.push({ aluno: st.name, turma: st.turma, matricula: st.matricula, ...j });
      });
    }
  });

  document.getElementById('tab-content-area').innerHTML = `
    <div class="portal-tab-content active" id="tab-diario">
      <h3>Diário de Classe - ${prof.subjectName} (${prof.name})</h3>
      <p style="margin-bottom:15px; color:#666;">Notas e faltas restritas exclusivamente à disciplina de ${prof.subjectName}.</p>
      <div class="table-responsive">
        <table class="dwu-table">
          <thead><tr><th>Aluno</th><th>Turma</th><th>N1</th><th>N2</th><th>N3</th><th>N4</th><th>Faltas (Qtd)</th><th>Ação</th></tr></thead>
          <tbody>
            ${systemDB.students.map((st, idx) => {
              const disc = st.disciplines.find(d => d.id === prof.subjectId);
              return `
                <tr>
                  <td><strong>${st.name}</strong></td>
                  <td>${st.turma}</td>
                  <td><input type="number" class="dwu-input-table" id="p-n1-${idx}" step="0.1" value="${disc.n1 ?? ''}"></td>
                  <td><input type="number" class="dwu-input-table" id="p-n2-${idx}" step="0.1" value="${disc.n2 ?? ''}"></td>
                  <td><input type="number" class="dwu-input-table" id="p-n3-${idx}" step="0.1" value="${disc.n3 ?? ''}"></td>
                  <td><input type="number" class="dwu-input-table" id="p-n4-${idx}" step="0.1" value="${disc.n4 ?? ''}"></td>
                  <td><input type="number" class="dwu-input-table" id="p-f-${idx}" value="${disc.faltas}"></td>
                  <td><button class="btn-small" onclick="saveProfNotes(${idx}, ${prof.subjectId})">Salvar</button></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="portal-tab-content" id="tab-justificativas-prof">
      <h3>Justificativas de Faltas Recebidas dos Alunos</h3>
      <p style="margin-bottom:15px; color:#666;">Acompanhe abaixo os atestados e motivos enviados pelos estudantes:</p>
      ${todasJustificativas.length > 0 ? `
        <div class="table-responsive">
          <table class="dwu-table">
            <thead>
              <tr>
                <th>Aluno(a)</th>
                <th>Turma</th>
                <th>Data da Ausência</th>
                <th>Motivo Descrito</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${todasJustificativas.map(j => `
                <tr>
                  <td><strong>${j.aluno}</strong><br><small style="color:#666;">Mat: ${j.matricula}</small></td>
                  <td>${j.turma}</td>
                  <td>${j.data}</td>
                  <td>${j.motivo}</td>
                  <td><span class="badge-status badge-rec">Pendente</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 6px; text-align: center; color: #666;">
          <i class="fa-solid fa-inbox" style="font-size: 2rem; margin-bottom: 10px; color: var(--dwu-blue);"></i>
          <p>Nenhuma justificativa de falta foi enviada pelos alunos até o momento.</p>
        </div>
      `}
    </div>

    <div class="portal-tab-content" id="tab-cadastro">
      <h3>Cadastrar Novo Aluno (Exclusivo para Professores)</h3>
      <form class="dwu-form" onsubmit="handleNewStudentRegister(event)">
        <div class="form-group"><label>Nome Completo do Aluno</label><input type="text" id="reg-nome" required></div>
        <div class="form-group"><label>Matrícula (Login)</label><input type="text" id="reg-mat" required></div>
        <div class="form-group"><label>Senha de Acesso do Aluno</label><input type="password" id="reg-pass" required></div>
        <div class="form-group"><label>Turma</label>
          <select id="reg-turma">
            <option>Infantil I</option><option>Infantil II</option><option>1º Ano</option><option>2º Ano</option><option>3º Ano</option><option>4º Ano</option><option>5º Ano</option>
          </select>
        </div>
        <button type="submit" class="btn-dwu-apply" style="border:none; cursor:pointer;">Cadastrar Aluno</button>
      </form>
    </div>
  `;
}

function saveProfNotes(studentIndex, subjectId) {
  const parse = (id) => { const v = document.getElementById(id).value; return v === "" ? null : parseFloat(v); };
  const disc = systemDB.students[studentIndex].disciplines.find(d => d.id === subjectId);
  
  disc.n1 = parse(`p-n1-${studentIndex}`);
  disc.n2 = parse(`p-n2-${studentIndex}`);
  disc.n3 = parse(`p-n3-${studentIndex}`);
  disc.n4 = parse(`p-n4-${studentIndex}`);
  disc.faltas = parseInt(document.getElementById(`p-f-${studentIndex}`).value) || 0;

  saveSystemData();
  alert("Notas e faltas salvas com sucesso!");
}

function handleNewStudentRegister(event) {
  event.preventDefault();
  const name = document.getElementById('reg-nome').value;
  const matricula = document.getElementById('reg-mat').value;
  const senha = document.getElementById('reg-pass').value;
  const turma = document.getElementById('reg-turma').value;

  if (systemDB.students.some(s => s.matricula === matricula)) {
    alert("Erro: Esta matrícula já está em uso!");
    return;
  }

  const newStudent = {
    name, matricula, senha, turma,
    disciplines: [
      { id: 0, name: "Língua Portuguesa", n1: null, n2: null, n3: null, n4: null, faltas: 0 },
      { id: 1, name: "Matemática", n1: null, n2: null, n3: null, n4: null, faltas: 0 },
      { id: 2, name: "História", n1: null, n2: null, n3: null, n4: null, faltas: 0 },
      { id: 3, name: "Geografia", n1: null, n2: null, n3: null, n4: null, faltas: 0 },
      { id: 4, name: "Ciências", n1: null, n2: null, n3: null, n4: null, faltas: 0 }
    ],
    justificativas: []
  };

  systemDB.students.push(newStudent);
  saveSystemData();
  alert(`Aluno(a) ${name} cadastrado! Ele já pode fazer login no sistema.`);
  event.target.reset();
  renderProfessorDiario(activeSession.data);
}

function calculateIFCalc() {
  const parseVal = (id) => {
    const el = document.getElementById(id);
    if (!el || el.value === "") return null;
    return parseFloat(el.value);
  };

  const n1 = parseVal('calc-n1');
  const n2 = parseVal('calc-n2');
  const n3 = parseVal('calc-n3');
  const n4 = parseVal('calc-n4');
  const pf = parseVal('calc-pf');
  const targetMedia = parseFloat(document.getElementById('calc-media-alvo').value);

  const res = computeIFCalcEngine(n1, n2, n3, n4, pf, targetMedia);

  document.getElementById('res-media-atual').innerText = res.currentAverage;
  document.getElementById('res-soma-pontos').innerText = `${res.currentSum} / ${res.targetTotal}`;
  
  const badge = document.getElementById('res-status-badge');
  badge.innerText = res.statusText;
  badge.className = `result-status ${res.badgeClass}`;

  document.getElementById('res-details-text').innerHTML = res.detailsText;
}

function switchPortalTab(tabId, element) {
  document.querySelectorAll('.portal-tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.portal-tab-btn').forEach(b => b.classList.remove('active'));
  
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
  }
  if (element) {
    element.classList.add('active');
  }
}