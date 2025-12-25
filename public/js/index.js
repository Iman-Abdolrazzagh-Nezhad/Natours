/* eslint-disable */

import '@babel/polyfill';
import { login } from './login';
import { logout } from './login';
import { updateSettings } from './update';

const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const newUserData = document.querySelector('.form-user-data');
const newUserPassword = document.querySelector('.form-user-password');

if (newUserPassword) {
  newUserPassword.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent =
      'Updating password';

    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    await updateSettings(
      { currentPassword, password, confirmPassword },
      'password',
    );

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (newUserData) {
  newUserData.addEventListener('submit', (e) => {
    e.preventDefault();

    const form = new FormData();

    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    updateSettings(form, 'data');
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}
