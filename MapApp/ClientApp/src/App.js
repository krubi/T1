import React, { Component } from 'react';
import { Map, GoogleApiWrapper } from 'google-maps-react';
import NumericInput from 'react-numeric-input';
import './components/Styles.css';
import Dropdown from 'react-dropdown';
import 'react-dropdown/style.css';

var options = [];
const defaultOption = [];

const initCenter = {
    lat: 57.7054781,
    lng: 11.9534032
};

export class MapContainer extends Component {

    constructor(props) {
        super(props);
        this.state = {
            poly: null,
            google: null,
            map: null,
            marker: null,
            paths: [],
            savedMaps: {}
        };
        this.initMap = this.initMap.bind(this);
        this.draw = this.draw.bind(this);
        this.addMarker = this.addMarker.bind(this);
        this.save = this.save.bind(this);
        this.load = this.load.bind(this);
        this.rotate = this.rotate.bind(this);
    }

    async initMap(mapProps, map) {
        const { google } = mapProps;
        const response = await fetch('mapdata');
        const data = await response.json();
        var savedMaps = {};
        data.forEach(savedMap => {
            options.push(savedMap.name);
            savedMaps[savedMap.name] = {
                marker: new google.maps.Marker({
                    position: savedMap.marker,
                    title: 'Start',
                    map: null,
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 2,
                    }
                }),
                polyLines: savedMap.paths.map(path => {
                    var linePath = path.g;
                    var polyline = new google.maps.Polyline({
                        path: linePath,
                        strokeColor: '#000000',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });
                    return polyline;
                })
            };
        })
        var marker = new google.maps.Marker({
            position: map.center,
            title: 'Start',
            map: map
        });
        this.setState({
            ...this.state,
            poly: new google.maps.Polyline({
                path: [map.center],
                strokeColor: '#000000',
                strokeOpacity: 1.0,
                strokeWeight: 2
            }),
            google: mapProps,
            map: map,
            marker: marker,
            savedMaps: savedMaps
        });
        this.state.poly.setMap(map);
        marker.setIcon({
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 2,
        });
        console.log("Poly Added");
    }

    draw() {
        var angle = Math.PI / 180 * parseInt(document.getElementById('angle-input').value);
        if (this.state.poly != null) {
            var zoom = this.state.map.zoom;
            var lonPP = 20 * 360 / (Math.pow(2, zoom) * 256);
            var latPP = lonPP / 2;
            const { google } = this.state.google;
            var path = this.state.poly.getPath();

            var last = path.getAt(path.length - 1);
            var newPos = new google.maps.LatLng(
                last.lat() + latPP * Math.sin(angle),
                last.lng() + lonPP * Math.cos(angle)
            );
            path.push(newPos);
            this.state.marker.setPosition(newPos);
        }

        console.log("Button Pressed!");
    }

    addMarker(mapProps, map, e) {
        const { google } = mapProps;
        var marker = this.state.marker;
        marker.setPosition(e.latLng);
        var icon = marker.getIcon();
        icon.rotation = (450 - parseInt(document.getElementById('angle-input').value)) % 360;
        marker.setIcon(icon);
        this.state.paths.push(this.state.poly);
        var newPoly = new google.maps.Polyline({
            path: [e.latLng],
            strokeColor: '#000000',
            strokeOpacity: 1.0,
            strokeWeight: 2
        });
        newPoly.setMap(map);
        this.setState({
            ...this.state,
            poly: newPoly,
        });
    }

    rotate(e) {
        var icon = this.state.marker.getIcon();
        icon.rotation = (450 - e) % 360;
        this.state.marker.setIcon(icon);
        console.log(e);
    }

    async save() {
        const { google } = this.state.google;
        var name = document.getElementById('name').value;
        if (!name) name = 'Default';
        var paths = this.state.paths;
        paths.push(this.state.poly);

        this.state.marker.setMap(null);
        paths.forEach(path => {
            path.setMap(null);
        });
        var savedMaps = this.state.savedMaps
        savedMaps[name] = {
            marker: this.state.marker,
            polyLines: paths
        };
        this.setState({
            ...this.state,
            savedMaps: savedMaps,
        });

        var allMaps = Object.keys(savedMaps).map((key, index) => {
            return {
                name: key,
                marker: savedMaps[key].marker.position,
                paths: savedMaps[key].polyLines.map(path => {
                    return path.getPath();
                })
            }
        });

        await fetch('mapdata', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(allMaps)
        })
        if (!options.includes(name)) options.push(name);

        this.setState({
            ...this.state,
            poly: new google.maps.Polyline({
                path: [this.state.map.center],
                strokeColor: '#000000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: this.state.map
            }),
            marker: new google.maps.Marker({
                position: this.state.map.center,
                title: 'Start',
                map: this.state.map,
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 2,
                }
            }),
            paths: []
        });

        console.log("Saved as");
    }

    load() {
        var name = document.getElementsByClassName("button-style-select")[0].innerText;
        if (!name) return;
        var savedMap = this.state.savedMaps[name];
        var loadedMarker = savedMap.marker;
        var loadedPaths = savedMap.polyLines;

        this.state.paths.push(this.state.poly);
        this.state.paths.forEach(path => {
            path.setMap(null);
        });

        this.state.marker.setMap(null);

        loadedMarker.setMap(this.state.map);
        loadedPaths.forEach(path => {
            path.setMap(this.state.map);
        });

        this.setState({
            ...this.state,
            poly: loadedPaths.pop(),
            marker: loadedMarker,
            paths: loadedPaths
        });
        console.log("Loaded ");
    }

    render() {
        return (
            <div>
                <Map
                    google={this.props.google}
                    zoom={14}
                    gestureHandling={"auto"}
                    zoomControl={false}
                    className="map-display"
                    onReady={this.initMap}
                    onClick={this.addMarker}
                    initialCenter={initCenter}>

                </Map>
                <div className="div-1">
                    <NumericInput
                        onChange={this.rotate}
                        id="angle-input"
                        className="number-input"
                        min={0}
                        max={360}
                        value={90}
                    />
                    <button onClick={this.draw} className="button-style-draw">Draw</button>
                </div>
                <div className="div-2">
                    <input id="name" type="text" name="Name" className="button-style-save" />
                    <button onClick={this.save} className="button-style-load">Save</button>
                </div>
                <div className="div-3">
                    <Dropdown id="select" options={options} value={defaultOption} placeholder="Load map" className="button-style-select" />
                    <button onClick={this.load} className="button-style-load">Load</button>
                </div>


            </div>
        );
    }
}

export default GoogleApiWrapper({
    apiKey: 'AIzaSyAPxnxSlHA36VIi2dUGWK39WFvWEMwtaD4'
})(MapContainer);

