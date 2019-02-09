const deleteButton = document.getElementById('delete');
const dialog = document.querySelector('.dialog');
const content = document.querySelector('.dialog .content');
const overlay = document.querySelector('.overlay');

deleteButton.addEventListener('click', e => {
    overlay.classList.toggle('overlay--show');
    content.classList.toggle('content--show');
});
