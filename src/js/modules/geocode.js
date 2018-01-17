export default function geoCode(coords) {
    return ymaps.geocode(coords)
        .then(result => {
            const address = result.geoObjects.get(0).properties.get('text'),
                popupHead = document.querySelector('.address');

            popupHead.textContent = address;

            return address;
        });
}