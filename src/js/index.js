import css from '../css/main.css';
import logo from '../img/logo.png';
import geoCode from './modules/geocode';
import placeMark from './modules/placemark';
import loadComments from './modules/loadcomments';
import validation from './modules/validation';

let myMap;
let clusterer;
let comments = [];

if (localStorage.comments) {
    comments = JSON.parse(localStorage.comments);
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
                    loadComments(document.querySelector('.balloon-link').textContent, comments);
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
                loadComments(myPLacemark.geometry.getCoordinates(), comments);
                coords = myPLacemark.geometry.getCoordinates();
            })
        })
        // обработка кликов по карте
        myMap.events.add('click', function (e) {

            // let clientPixels = e.getSourceEvent().originalEvent.clientPixels;
            form.querySelector('.input-name').classList.remove('error');
            form.querySelector('textarea').classList.remove('error');
            coords = e.get('coords');
            geoCode(coords);
            popup.style.display = 'block';
            loadComments(coords, comments);
        })

        form.querySelector('.input-name').addEventListener('focus', e => {
            if (e.target.classList.contains('error')) {
                e.target.classList.remove('error');
            }
        })
        form.querySelector('textarea').addEventListener('focus', e => {
            if (e.target.classList.contains('error')) {
                e.target.classList.remove('error');
            }
        })

        // обработка клика по добавить
        addButton.addEventListener('click', (e) => {
            e.preventDefault();
            let obj = {},
                d = new Date(),
                month = (d.getMonth() + 1),
                myPlacemark; 

            (month < 10) ? (month = '0'+month) : month;

            if (!validation(form)) {
                return
            }

            geoCode(coords).then( res => {
                obj.coords = coords;
                obj.address = res;
                obj.name = form.children[0].value;
                obj.place = form.children[1].value;
                obj.comment = form.children[2].value;
                obj.date = d.getDate() + '.' + month + '.' + d.getFullYear();

                comments.push(obj);
                myPlacemark = placeMark(coords, obj);
                loadComments(myPlacemark.geometry.getCoordinates(), comments);
                // обработка кликов по добавленным меткам
                myPlacemark.events.add('click', () => {
                    popup.style.display = 'block';
                    loadComments(myPlacemark.geometry.getCoordinates(), comments);
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