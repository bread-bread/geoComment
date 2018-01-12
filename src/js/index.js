import css from '../css/main.css';
import Handlebars from '../../node_modules/handlebars/dist/handlebars';
import img from '../img/marks.png';

// получение адресной строки
function geoCode(coords) {
    return ymaps.geocode(coords)
        .then(result => {
            const address = result.geoObjects.get(0).properties.get('text'),
                popupHead = document.querySelector('.address');

            popupHead.textContent = address;

            return address;
        });
}
let myMap;
let clusterer;
let comments = [];

if (localStorage.comments) {
    comments = JSON.parse(localStorage.comments);
}
// Создание метки
function placeMark(coords, obj) {
    let myPlacemark = new ymaps.Placemark(
        coords,
        {
            Header: obj.place,
            Body: obj.comment,
            Link: obj.address,
            Footer: obj.date,
            CoordX: obj.coords[0],
            CoordY: obj.coords[1]
        }, 
        {
            iconLayout: 'default#image',
            iconImageHref: img,
            iconImageSize: [22, 33],
            iconImageOffset: [-11, -30]
        })

    geoCode(coords);

    return myPlacemark;
}
// загрузка отзывов
function loadComments(coords, address) { // адрес получить с клика по ссылке
    let block = document.querySelector('.comments');

    block.innerHTML = '';
    if (coords) {
        comments.map(comment => {
            if (comment.coords.join() === coords.join()) {
                block.innerHTML += renderCom(comment);
            }
        })
    } else if (address) {
        comments.map(comment => {
            if (comment.address === address) {
                block.innerHTML += renderCom(comment);
            }
        })
    }
}
// render
function renderCom(obj) {
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

new Promise(resolve => ymaps.ready(resolve))
    .then(() => {
        let coords;
        const popup = document.querySelector('.popup'),
            addButton = document.querySelector('.add-btn'),
            form = document.querySelector('.comment-form'),
            closeBtn = document.querySelector('.close-btn');

        // инициализация карты
        myMap = new ymaps.Map('map', {
            center: [59.9342802, 30.335098600000038],
            zoom: 12,
            controls: ['zoomControl', 'searchControl']
        }, {
            searchControlProvider: 'yandex#search'
        });

        // шаблон для карусели
        let customItemContentLayout = ymaps.templateLayoutFactory.createClass(
            '<h3 class="balloon-header">{{properties.Header|raw}}</h3>' +
            '<a href="#" class="balloon-link" data-x="{{properties.CoordX}}"' +
            'data-y="{{properties.CoordY}}">{{properties.Link|raw}}</a>' +
            '<div class="balloon-body">{{properties.Body|raw}}</div>' +
            '<div class="balloon-footer">{{properties.Footer|raw}}</div>',
            {
                build: function () {
                    customItemContentLayout.superclass.build.call(this);
                    document.querySelector('.balloon-link').addEventListener('click', this.onLinkClick);
                },
                clear: function () {
                    document.querySelector('.balloon-link').removeEventListener('click', this.onLinkClick);
                    customItemContentLayout.superclass.clear.call(this);
                },

                onLinkClick: function (e) {
                    e.preventDefault();
                    popup.style.display = 'block';
                    loadComments('', document.querySelector('.balloon-link').textContent);
                    popup.querySelector('.address').textContent = document.querySelector('.balloon-link').textContent;
                    myMap.balloon.close();
                    coords = [e.target.dataset.x, e.target.dataset.y];
                }
            }
        )

        // создание экземпляра кластера
        clusterer = new ymaps.Clusterer({
            preset: 'islands#invertedBlackClusterIcons',
            clusterDisableClickZoom: true,
            openBalloonOnClick: true,
            groupByCoordinates: false,
            clusterBalloonContentLayout: 'cluster#balloonCarousel',
            clusterBalloonItemContentLayout: customItemContentLayout,
            clusterBalloonPanelMaxMapArea: 0,
            clusterBalloonContentLayoutWidth: 220,
            clusterBalloonContentLayoutHeight: 160,
            clusterBalloonPagerSize: 5
        });
        // добавление кластера на карту
        myMap.geoObjects.add(clusterer);
        // загрузка и добавление на карту существующих меток
        comments.map(comment => {
            let myPLacemark = placeMark(comment.coords, comment);

            clusterer.add(myPLacemark);
            // Обработка кликов по загруженным меткам
            myPLacemark.events.add('click', () => {
                popup.style.display = 'block';
                geoCode(myPLacemark.geometry.getCoordinates());
                loadComments(myPLacemark.geometry.getCoordinates());
                coords = myPLacemark.geometry.getCoordinates();
            })
        })
        // обработка кликов по карте
        myMap.events.add('click', function (e) {

            // let clientPixels = e.getSourceEvent().originalEvent.clientPixels;

            coords = e.get('coords');
            geoCode(coords);
            popup.style.display = 'block';
            loadComments(coords);
        })
        // обработка клика по добавить

        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            let obj = {},
                d = new Date(),
                month = (d.getMonth() + 1),
                myPlacemark; 

            (month < 10) ? (month = '0'+month) : month;

            geoCode(coords).then( res => {
                obj.coords = coords;
                obj.address = res;
                obj.name = form.children[0].value;
                obj.place = form.children[1].value;
                obj.comment = form.children[2].value;
                obj.date = d.getDate() + '.' + month + '.' + d.getFullYear();

                comments.push(obj);
                myPlacemark = placeMark(coords, obj);
                loadComments(myPlacemark.geometry.getCoordinates());
                // обработка кликов по добавленным меткам
                myPlacemark.events.add('click', () => {
                    popup.style.display = 'block';
                    loadComments(myPlacemark.geometry.getCoordinates());
                    coords = myPlacemark.geometry.getCoordinates();
                    popup.querySelector('.address').textContent = res;
                })
                clusterer.add(myPlacemark);
                form.reset();
                localStorage.comments = JSON.stringify(comments);
            })
        })
        // обработка клика закрытия окна
        closeBtn.addEventListener('click', e => {
            e.preventDefault();
            popup.style.display = 'none';
        })
    })
    .catch(error => {
        console.error(error.message);
    })