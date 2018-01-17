import img from '../../img/marks.png';
import geoCode from './geocode';

export default function placeMark(coords, obj) {
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