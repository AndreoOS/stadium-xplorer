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
  _Expand;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 11;
  center: Array<number> = [ -73.935242, 40.730610];
  basemap = "arcgis-navigation";
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
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet, Expand, Search] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/geometry/Point",
        "esri/layers/GraphicsLayer",
        "esri/rest/route",
        "esri/rest/support/RouteParameters",
        "esri/rest/support/FeatureSet",
        "esri/widgets/Expand",
        "esri/widgets/Search"
      ]);

      esriConfig.apiKey = "AAPK4038e29fa0f74e0b8de1e11638e315f7tQdieJSSWdSXfF2Pv3hfTdEnEDKViIoVKZcxNbpqpJujF5y3VG8epOt98WKFYzQ3";

      this._Map = Map;
      this._MapView = MapView;
      this._FeatureLayer = FeatureLayer;
      this._Graphic = Graphic;
      this._GraphicsLayer = GraphicsLayer;
      this._Route = route;
      this._RouteParameters = RouteParameters;
      this._FeatureSet = FeatureSet;
      this._Point = Point;
      this._Expand = Expand;

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      // Define a pop-up for Trailheads
      const Restaurantsheads = {
        "title": "{NAME} [{PRICE_RANGE}]",
        "content":  "This restaurant has <b> {REVIEWS}</b> based on {NO_OF_REVIEWS}. <br>" +
        "<br> <b>Type:</b> {TYPE} " +
        "<br><b>Street Address:</b> {STREET_ADDRESS} " +
        "<br><b>Contact Number:</b> {CONTACT_NUMBER}" +
        "<br><b>Menu:</b> {MENU}<br>" +
        "<br><a href=\"{TRIP_ADVISOR_URL}\"> Click here to visit the Trip Advisor URL </a>"
      }

      // Trailheads feature layer (points)
      const restaurantsLayer: __esri.FeatureLayer = new this._FeatureLayer({
        url:
          "https://services7.arcgis.com/pTj9WvqAiBmhC4U7/arcgis/rest/services/nyc_tripadvisor_restauarantrecommendation/FeatureServer/0",
        outFields: ["ID",	"NAME",	"STREET_ADDRESS",	"LOCATION",	"TYPE",	"NO_OF_REVIEWS",
          "REVIEWS",	"COMMENTS",	"CONTACT_NUMBER", "TRIP_ADVISOR_URL",	"PRICE_RANGE",
          "MENU",	"LATITUDE",	"LONGITUDE"],
        popupTemplate: Restaurantsheads,
        /*symbol: {
          type: "simple-marker",
          color: "#f50be9",
          size: "5px",
          outline: {
            color: "#3c255c",
            width: "0.5px"
          }
        }*/
      });

      this.map.add(restaurantsLayer);

      // Initialize the MapView
      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };

      this.view = new MapView(mapViewProperties);
      const origin = new Point([-74.003,40.73103]);
      const destination = new Point([-74.003,40.73103]);


      //add Search Widget
      const searchWidget =  new Search({
        view: this.view,
        allPlaceholder: "Search a location",
        includeDefaultSources: false,
        sources: [
            {
            layer: restaurantsLayer,
            searchFields: ["NAME",	"STREET_ADDRESS"],
            displayFields: ["NAME", "STREET_ADDRESS"],
            exactMatch: false,
            outFields: ["LOCATION"],
            name: "NYC Restaurants",
            placeholder: "Find a restaurant in NYC"
            },
            {
              name: "All locations",
              placeholder: "Search anything",
              apiKey: esriConfig.apiKey,
              singleLineFieldName: "SingleLine",
              url: "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer"
            }
        ]
      });

      this.view.ui.add(searchWidget, {
        position: "top-left",
        index: 0,
      });

      // Empire State
      this.addPoint(-73.9857, 40.7484);
      // Liberty Statue
      this.addPoint(-74.0445, 40.6892);
      // Central Park
      this.addPoint(-73.9682, 40.7850);
      // Times Square
      this.addPoint(-73.9851, 40.7588);
      // Brooklyn Bridge
      this.addPoint(-73.9970, 40.7060);
      // Grand Central Terminal
      this.addPoint(-73.9772, 40.7526);

      this.view.when(()=>{

      });

      this.view.on("click", (event)=>{
        if (this.view.graphics.length === 0) {
          this.addGraphic("start", event.mapPoint);
        }  else if (this.view.graphics.length === 1) {
          this.addGraphic("finish", event.mapPoint);
          this.getRoute();
        } else {
          this.view.graphics.removeAll();
          this.view.ui.empty("top-right");
          this.addGraphic("start",event.mapPoint);
        }
      });

      this.filterData(restaurantsLayer);
      // Fires `pointer-move` event when user clicks on "Shift"
      // key and moves the pointer on the view.
      this.view.on('pointer-move', ["Shift"], (event) => {
        let point = this.view.toMap({ x: event.x, y: event.y });
        console.log("map moved: ", point.longitude, point.latitude);
      });

      await this.view.when(); // wait for map to load
      console.log(this.view.graphics);
      return this.view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }


  }
  addGraphic(type, point) {
    let color = "#ffffff";
    let outlineColor = "#000000"
    let size = "12px";
    if (type == "start") {
      color = "#ffffff";
    }  else {
      color = "#96C6F9";
      outlineColor = "#ffffff";
    }
    const graphic = new this._Graphic({
      symbol: {
        type: "simple-marker",
        color: color,
        size: size,
        outline: {
          color: outlineColor,
          width: "1px"
        }
      },
      geometry: point
    });
    this.view.graphics.add(graphic);
  }

  addPoint(long, lat) {
    const empireStateBuildingPoint = {
      type: "point",
      longitude: long,
      latitude: lat
    };

    const orangePointGraphic = new this._Graphic({
      geometry: empireStateBuildingPoint,
      symbol: {
        type: "simple-marker",
        color: "#0B20F5",
        size: "10px",
        outline: {
          color: "#27255C",
          width: "1px"
        }
      },
    });

    this.view.graphics.add(orangePointGraphic);
}

  filterData(restaurantsLayer) {

    let floodLayerView;

    const cuisinesNodes = document.querySelectorAll(`.cuisine-item`);
    const cuisinesElement = document.getElementById("cuisines-filter");

    // click event handler for cuisines choices
    cuisinesElement.addEventListener("click", filterBycuisine);

    // User clicked on Winter, Spring, Summer or Fall
    // set an attribute filter on flood warnings layer view
    // to display the warnings issued in that cuisine
    function filterBycuisine(event) {
      const selectedcuisine = event.target.getAttribute("data-cuisine");
      console.log(selectedcuisine);
      floodLayerView.filter = {
            where: "Type LIKE '%" + selectedcuisine + "%'"
      };
    }

    this.view.whenLayerView(restaurantsLayer).then((layerView) => {
      // flash flood warnings layer loaded
      // get a reference to the flood warnings layerview
      floodLayerView = layerView;

      // set up UI items
      cuisinesElement.style.visibility = "visible";
      const cuisinesExpand = new this._Expand({
        view: this.view,
        content: cuisinesElement,
        expandIconClass: "esri-icon-filter",
        group: "bottom-left"
      });
      //clear the filters when user closes the expand widget
      cuisinesExpand.watch("expanded", () => {
        if (!cuisinesExpand.expanded) {
          floodLayerView.filter = null;
        }
      });
      this.view.ui.add(cuisinesExpand, "top-left");
      this.view.ui.add("titleDiv", "bottom-right");
    });
  }

  getRoute() {

    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";

    const routeParams = new this._RouteParameters({
      stops: new this._FeatureSet({
        features: this.view.graphics.toArray()
      }),
      returnDirections: true,
      directionsLanguage: "en"
    });

    this._Route.solve(routeUrl, routeParams)
      .then((data)=> {
        if (data.routeResults.length > 0) {
          this.showRoute(data.routeResults[0].route);
          this.showDirections(data.routeResults[0].directions.features);
        }
      })
      .catch((error)=>{
        console.log(error);
      })
  }

  showRoute(routeResult) {

    routeResult.symbol = {
      type: "simple-line",
      color: [63, 81, 186],
      width: 3
    };
    this.view.graphics.add(routeResult,0);
  }

  showDirections(directions) {
    function showRouteDirections(directions) {
      const directionsList = document.createElement("ol");
      directions.forEach(function(result,i){
        const direction = document.createElement("li");
        direction.innerHTML = result.attributes.text + ((result.attributes.length > 0) ? " (" + result.attributes.length.toFixed(2) + " miles)" : "");
        directionsList.appendChild(direction);
      });
      directionsElement.appendChild(directionsList);
    }

    const directionsElement = document.createElement("div");
    directionsElement.innerHTML = "<h3>Directions</h3>";
    directionsElement.style.marginTop = "0";
    directionsElement.style.padding = "0 15px";
    directionsElement.className =  "esri-widget esri-widget--panel esri-directions__scroller directions";
    directionsElement.style.backgroundColor ="#FFFFFF"
    directionsElement.style.minHeight = "365px";

    showRouteDirections(directions);

    this.view.ui.empty("top-right");
    this.view.ui.add(new this._Expand({
      view:this.view,
      content:directionsElement,
      expanded:true,
      mode:"floating"}), "top-right");
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