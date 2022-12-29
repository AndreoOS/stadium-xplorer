/*
  Copyright 2019 Esri
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { setDefaultOptions, loadModules } from 'esri-loader';
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  // register Dojo AMD dependencies
  _Map;
  _MapView;
  _FeatureLayer;
  _Graphic;
  _GraphicsLayer;
  _Route;
  _RouteParameters;
  _FeatureSet;
  _Point;
  _locator;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 11;
  center: Array<number> = [ -73.935242, 40.730610];
  basemap = "streets-vector";
  loaded = false;
  pointCoords: number[] = [ -73.935242, 40.730610];
  dir: number = 0;
  count: number = 0;
  timeoutHandler = null;

  constructor() { }

  async initializeMap() {
    try {
      // configure esri-loader to use version x from the ArcGIS CDN
      // setDefaultOptions({ version: '3.3.0', css: true });
      setDefaultOptions({ css: true });

      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet"
      ]);

      // esriConfig.apiKey = "MY_API_KEY";

      this._Map = Map;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      this.addFeatureLayers();

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);

      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on('pointer-move', ["Shift"], (event) => {
        let point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log("ArcGIS map loaded");
      // this.addRouter();
      console.log(this.view.center);
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }


  addFeatureLayers() {
    // Define a pop-up for Trailheads
    const Restaurantsheads = {
      "title": "{NAME}",
      "content": "<b>Id:</b> {ID}<br><b>Name:</b> {NAME}<br><b>Street Address:</b> " +
          "{STREET_ADDRESS}<br><b>Location:</b> {LOCATION}<br><b>Type:</b> {TYPE}<br><b>No of Reviews:</b> " +
          "{NO_REVIEWS}<br><b>Reviews:</b> {REVIEWS}<br><b>Comments:</b> {COMMENTS}<br><b>Contact Number:</b>" +
          " {CONTACT_NUMBER}<br><b>Trip Advisor URL:</b> {TRIP_ADVISOR_URL}<br><b>Price Range:</b> {PRICE_RANGE}" +
          "<br><b>Menu:</b> {MENU}<br><b>Latitude:</b> {LATITUDE}<br><b>Longitude:</b> {LONGITUDE}"
    }

    // Trailheads feature layer (points)
    var restaurantsLayer: __esri.FeatureLayer = new this._FeatureLayer({
      url:
        "https://services7.arcgis.com/pTj9WvqAiBmhC4U7/arcgis/rest/services/nyc_tripadvisor_restauarantrecommendation/FeatureServer/0",
      outFields: ["ID",	"NAME",	"STREET_ADDRESS",	"LOCATION",	"TYPE",	"N0_REVIEWS",
        "REVIEWS",	"COMMENTS",	"CONTACT_NUMBER", "TRIP_ADVISOR_URL",	"PRICE_RANGE",
        "MENU",	"LATITUDE",	"LONGITUDE"],
      popupTemplate: Restaurantsheads
    });

    this.map.add(restaurantsLayer);


  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(() => {
      // The map has been initialized
      console.log("mapView ready: ", this.view.ready);
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy() {
    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }
}
