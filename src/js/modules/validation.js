export default function validation (form) {
    let input = form.querySelector('.input-name'),
        textarea = form.querySelector('textarea'),
        flag = true;

    if (input.value === '') {
        flag = false;
        input.classList.add('error');
    }
    if (textarea.value === '') {
        flag = false;
        textarea.classList.add('error');
    }

    return flag;
}