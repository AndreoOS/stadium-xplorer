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
  _Legend;
  _LayerList;
  _MapImageLayer;
  _Home;

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
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet, Expand, Search, Legend, LayerList, MapImageLayer, Home] = await loadModules([
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
        "esri/widgets/Search",
        "esri/widgets/Legend",
        "esri/widgets/LayerList",
        "esri/layers/MapImageLayer",
        "esri/widgets/Home"
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
      this._Legend = Legend;
      this._LayerList = LayerList;
      this._MapImageLayer = MapImageLayer;
      this._Home = Home;

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      const trailheadsRenderer = {
        "type": "simple",
        "symbol": {
          "type": "picture-marker",
          "url": "../../../../assets/restaurant-icon.svg",
          "width": "18px",
          "height": "18px"
        }
      }

// Define a pop-up for Trailheads
const Restaurantsheads = {
  "title": "{NAME} [{PRICE_RANGE}]",
  "content": "<br><img src='{IMAGE_URL}' height='150' width='200'><br>" +
    "This restaurant has <b>{REVIEWS}</b> based on {NO_OF_REVIEWS}. <br>" +
    "<br> <b>Type:</b> {TYPE} " +
    "<br><b>Street Address:</b> {STREET_ADDRESS} " +
    "<br><b>Contact Number:</b> {CONTACT_NUMBER}" +
    "<br><b>Menu:</b> {MENU}<br>" +
    "<br><a href='{TRIP_ADVISOR_URL}'> Click here to visit the Trip Advisor URL </a>"
};
const trailheadsLabels = {
  symbol: {
    type: "text",
    color: "#FFFFFF",
    haloColor: "#5E8D74",
    haloSize: "2px",
    font: {
      size: "12px",
      family: "Noto Sans",
      style: "italic",
      weight: "normal"
    }
  },

  labelPlacement: "above-center"
};

//add traffic layer
const trafficLayer = new MapImageLayer({
    url: "https://traffic.arcgis.com/arcgis/rest/services/World/Traffic/MapServer",
    dpi: 48,
    imageFormat: "png32",
    refreshInterval: 1,
    useViewTime: false
});

this.map.add(trafficLayer);

// Trailheads feature layer (points)
const restaurantsLayer: __esri.FeatureLayer = new this._FeatureLayer({
  title: 'Restaurants',
  url:
    "https://services7.arcgis.com/pTj9WvqAiBmhC4U7/arcgis/rest/services/nycrestaurants/FeatureServer/0",
  outFields: ["ID",	"NAME",	"STREET_ADDRESS",	"LOCATION",	"TYPE",	"NO_OF_REVIEWS",
    "REVIEWS",	"COMMENTS",	"CONTACT_NUMBER", "TRIP_ADVISOR_URL",	"PRICE_RANGE",
    "MENU",	"LATITUDE",	"LONGITUDE", "IMAGE_URL"],
  popupTemplate: Restaurantsheads,
  renderer: trailheadsRenderer,
  labelingInfo: [trailheadsLabels]
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

      // Create helpful instructions
              const sampleInstructions = document.createElement("div");
              sampleInstructions.setAttribute("style", "backgound-color: white");
              sampleInstructions.id = "sampleInstructions";
              sampleInstructions.innerHTML =
                "Click on the blue icons to see the restaurants and their details.<br></br>You can filter them by cuisine (top left).<br></br> Select two points by clicking anywhere on the map to find the route between them.<br></br> You can hide/unhide layers from the layer list in the bottom left corner.";

      this.view.ui.add(
        [
          new Expand({
            expandIconClass: "esri-icon-question",
            expandTooltip: "How to use this map",
            view: this.view,
            content: sampleInstructions,
            group: "top-left"
          })], "top-left"
      );

      const homeBtn = new this._Home({
          view: this.view
      });
      this.view.ui.add(homeBtn, "top-left");

      const attractionsLayer = new this._GraphicsLayer({
        title: 'Tourist attractions',
        graphics: []
      });
      this.map.add(attractionsLayer);
      // Empire State
      this.addPoint(-73.9857, 40.7484, attractionsLayer);
      // Liberty Statue
      this.addPoint(-74.0445, 40.6892, attractionsLayer);
      // Central Park
      this.addPoint(-73.9682, 40.7850, attractionsLayer);
      // Times Square
      this.addPoint(-73.9851, 40.7588, attractionsLayer);
      // Brooklyn Bridge
      this.addPoint(-73.9970, 40.7060, attractionsLayer);
      // Grand Central Terminal
      this.addPoint(-73.9772, 40.7526, attractionsLayer);

        this.view.when(() => {
          const layerList = new LayerList({
            view: this.view
          });

          // Add widget to the top right corner of the view
          this.view.ui.add(layerList, "bottom-leading");
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
      this.addLegend(restaurantsLayer, attractionsLayer);
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

  addPoint(long, lat, attractionsLayer) {
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

    attractionsLayer.add(orangePointGraphic);
}

  addLegend(restaurantsLayer, attractionsLayer) {
    const legend = new this._Legend({
        view: this.view,
        layerInfos: [
            {
                layer: restaurantsLayer,
                title: "Restaurants"
            }
        ]
    });
    this.view.ui.add(legend, "bottom-left");
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