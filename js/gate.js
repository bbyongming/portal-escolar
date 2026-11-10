/**
 * GATE.JS - Autenticação Corrigida
 */

function handleLogin(event, type) {
  event.preventDefault();
  // Atualizado para buscar os IDs corretos do formulário
  const matricula = document.getElementById(type === 'aluno' ? 'login-aluno-mat' : 'login-prof-mat').value.trim();
  const senha = document.getElementById(type === 'aluno' ? 'login-aluno-pass' : 'login-prof-pass').value.trim();

  // Recarrega os dados mais recentes do localStorage
  systemDB = getSystemData();

  if (type === 'aluno') {
    const student = systemDB.students.find(s => s.matricula === matricula && s.senha === senha);
    if (student) {
      activeSession = { type: 'aluno', data: student };
      loadAlunoDashboard();
    } else {
      alert("Matrícula ou senha de aluno incorretos!");
    }
  } else {
    const prof = systemDB.professors.find(p => p.matricula === matricula && p.senha === senha);
    if (prof) {
      activeSession = { type: 'professor', data: prof };
      loadProfessorDashboard();
    } else {
      alert("Credenciais de professor incorretas! Verifique o usuário (ex: prof-mat) e a senha (123).");
    }
  }
}

function logout() {
  activeSession = null;
  document.getElementById('login-section').style.display = 'block';
  document.getElementById('dashboard-section').style.display = 'none';
}

function switchLoginTab(type) {
  document.getElementById('form-login-aluno').style.display = type === 'aluno' ? 'flex' : 'none';
  document.getElementById('form-login-prof').style.display = type === 'professor' ? 'flex' : 'none';
  document.getElementById('tab-btn-aluno').classList.toggle('active', type === 'aluno');
  document.getElementById('tab-btn-prof').classList.toggle('active', type === 'professor');
}