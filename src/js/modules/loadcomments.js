import renderCom from './render';

export default function loadComments(location, comments) { // в location приходят либо координаты либо адрес 
    let block = document.querySelector('.comments');

    block.innerHTML = '';
    if (location instanceof Array) {
        comments.map(comment => {
            if (comment.coords.join() === location.join()) {
                block.innerHTML += renderCom(comment);
            }
        })
    } else {
        comments.map(comment => {
            if (comment.address === location) {
                block.innerHTML += renderCom(comment);
            }
        })
    }
}