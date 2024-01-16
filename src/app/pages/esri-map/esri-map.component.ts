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
import { AttachmentsContent } from "esri/popup/content";

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
  _AttachmentsContent;

  // Instances
  map: esri.Map;
  view: esri.MapView;
  pointGraphic: esri.Graphic;
  graphicsLayer: esri.GraphicsLayer;

  // Attributes
  zoom = 3;
  center: Array<number> = [10.861647, 48.306584];
  basemap = "arcgis-navigation";
  loaded = false;
  pointCoords: number[] = [10.861647, 48.306584];
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
      const [esriConfig, Map, MapView, FeatureLayer, Graphic, Point, GraphicsLayer, route, RouteParameters, FeatureSet, Expand, Search, Legend, LayerList, MapImageLayer, Home, AttachmentsContent] = await loadModules([
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
        "esri/widgets/Home",
        "esri/popup/content/AttachmentsContent"
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
      this._AttachmentsContent = AttachmentsContent

      // Configure the Map
      const mapProperties = {
        basemap: this.basemap
      };

      this.map = new Map(mapProperties);

      const stadiumRenderer = {
        "type": "simple",
        "symbol": {
          "type": "picture-marker",
          "url": "../../../../assets/stadium-icon.svg",
          "width": "23px",
          "height": "23px"
        }
      }

// Define a pop-up for Stadium
const attachmentsElement = new AttachmentsContent({
  displayType: "auto"
})
const stadiumHeads = {
  "title": "{STADIUM_NAME} [{TOURNEY_NAME} - {SEASON}]",
  "content": "<br> <b>Attendance:</b> {ATTENDANCE}<br>" +
    "<br> <b>Winner:</b> {CLUB_WINNER} " +
    "<br><b>Runners-Up</b> {CLUB_RUNNERS_UP} "};
const  stadiumLabels = {
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
    useViewTime: false,
    minScale: 7,
});

this.map.add(trafficLayer);

// Trailheads feature layer (points)
const stadiumsLayer: __esri.FeatureLayer = new this._FeatureLayer({
  title: 'Stadiums',
  url:
    "https://services.arcgis.com/emS4w7iyWEQiulAb/arcgis/rest/services/Champions_League_Final_Stadiums/FeatureServer",
  outFields: ["*"],
  popupTemplate: stadiumHeads,
  renderer: stadiumRenderer,
  labelingInfo: [stadiumLabels],
});

this.map.add(stadiumsLayer);

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
            layer: stadiumsLayer,
            searchFields: ["SEASON", "STADIUM_NAME"],
            displayFields: ["SEASON", "STADIUM_NAME"],
            exactMatch: false,
            outFields: ["STADIUM_CITY"],
            name: "Stadiums",
            placeholder: "Find a UCL Final Stadium"
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
                "Click on the stadium icons to see the stadiums and the details about their finals.<br></br>You can filter them by decade (top left).<br></br> Select two points by clicking anywhere on the map to find the route between them.<br></br> You can hide/unhide layers from the layer list in the bottom left corner.";

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
      this.addPoint(2.2945, 48.858222, attractionsLayer);
      this.addPoint(12.49215043375397, 41.89044581077842, attractionsLayer);
      this.addPoint(23.72585638845186, 37.97198846541044, attractionsLayer);
      this.addPoint(2.174361164441915, 41.403714397327455, attractionsLayer);
      this.addPoint(-0.07594254561997694, 51.50817878245558, attractionsLayer);
      this.addPoint(12.452596879484528, 41.90417561921269, attractionsLayer);
      this.addPoint(13.377500873726467, 52.51659756614626, attractionsLayer);
      this.addPoint(2.3377298307301917, 48.860632275280636, attractionsLayer);
      this.addPoint(14.411624354655284, 50.086597568982725, attractionsLayer);
      this.addPoint(10.74962332791907, 47.55793983822316, attractionsLayer);
      this.addPoint(-3.199477702748022, 55.94871184542899, attractionsLayer);
      this.addPoint(-3.5877803979317164, 37.17617594219077, attractionsLayer);
      this.addPoint(-0.14154579139590148, 51.501461610327944, attractionsLayer);
      this.addPoint(4.884561221599788, 52.37532627195454, attractionsLayer);
      this.addPoint(28.977602369472486, 41.00558367431737, attractionsLayer);
      this.addPoint(-2.9334592649066145, 43.26876885213471, attractionsLayer);
      this.addPoint(-9.210958360766035, 38.70033124954288, attractionsLayer);

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

      this.filterData(stadiumsLayer);
      this.addLegend(stadiumsLayer, attractionsLayer);
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
    const attractionsPoint = {
      type: "point",
      longitude: long,
      latitude: lat
    };

    const attractionsPointGraphic = new this._Graphic({
      geometry: attractionsPoint,
      symbol: {
        type: "picture-marker",
        url: "../../../assets/attractions_pin.png",
        width: "23px",
        height: "23px"
      },
    });

    attractionsLayer.add(attractionsPointGraphic);
}

  addLegend(stadiumsLayer, attractionsLayer) {
    const legend = new this._Legend({
        view: this.view,
        layerInfos: [
            {
                layer: stadiumsLayer,
                title: "Legend"
            },
        ]
    });
    this.view.ui.add(legend, "bottom-left");
  }


  filterData(stadiumsLayer) {

    let floodLayerView;

    const decadesElement = document.getElementById("decades-filter");

    // click event handler for cuisines choices
    decadesElement.addEventListener("click", filterByDecade);

    // User clicked on Winter, Spring, Summer or Fall
    // set an attribute filter on flood warnings layer view
    // to display the warnings issued in that cuisine
    function filterByDecade(event) {
      const selectedDecade = event.target.getAttribute("data-decade");
      console.log(selectedDecade);
      floodLayerView.filter = {
            where: "Decade LIKE '%" + selectedDecade + "%'"
      };
    }

    this.view.whenLayerView(stadiumsLayer).then((layerView) => {
      // flash flood warnings layer loaded
      // get a reference to the flood warnings layerview
      floodLayerView = layerView;

      // set up UI items
      decadesElement.style.visibility = "visible";
      const decadesExpand = new this._Expand({
        view: this.view,
        content: decadesElement,
        expandIconClass: "esri-icon-filter",
        group: "bottom-left"
      });
      //clear the filters when user closes the expand widget
      decadesExpand.watch("expanded", () => {
        if (!decadesExpand.expanded) {
          floodLayerView.filter = null;
        }
      });
      this.view.ui.add(decadesExpand, "top-left");
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