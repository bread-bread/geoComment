import Handlebars from '../../../node_modules/handlebars/dist/handlebars';

export default function renderCom(obj) {
    const template = `
        <div class="info">
            <span class="name">{{name}}</span>
            <span class="place">{{place}}</span>
            <span class="date">{{date}}</span>
        </div>
        <div class="comment">{{comment}}</div>`;

    const render = Handlebars.compile(template);
    const html = render(obj);

    return html;
}