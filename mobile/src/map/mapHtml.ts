// The map page that runs inside the WebView. Leaflet and the saved roads are embedded (assets.generated.ts), so the
// map opens with no connection. Tiles: CARTO Voyager, then OpenStreetMap, then the saved roads drawn offline, the same
// order as the web app (frontend/src/components/map/BaseMap.tsx). The app sends layers with window.fw.setData(...)
// and the page posts back { type: 'basemap' | 'shelter' | 'ready' } messages.
import { LEAFLET_CSS, LEAFLET_JS, OFFLINE_ROADS } from './assets.generated';

export interface MapPayload {
  you: { lat: number; lon: number } | null;
  shelters: { id: string; name: string; lat: number; lon: number; status: string }[];
  /** Flood areas: camera zones, verified-report areas and the demo flood-prone areas. */
  zones: { id: string; lat: number; lon: number; radiusM: number; kind: 'camera' | 'report' | 'demo'; color: string; label: string }[];
  /** Fit the view to these points once, on the first data. */
  fit: [number, number][];
}

const page = (roads: string) => `<!doctype html><html><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>${LEAFLET_CSS}
html,body,#map{height:100%;margin:0;background:#EEF1F5}
.lbl{background:transparent;border:0;box-shadow:none;color:#475569;font:700 12px sans-serif;text-shadow:0 0 3px #fff,0 0 3px #fff}
.lbl:before{display:none}
.you{width:18px;height:18px;border-radius:50%;background:#1677FF;border:3px solid #fff;box-shadow:0 0 0 6px rgba(22,119,255,.25)}
</style></head><body><div id="map"></div>
<script>${LEAFLET_JS}</script>
<script>
(function(){
  var post=function(m){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var map=L.map('map',{zoomControl:false,attributionControl:true}).setView([3.155,101.69],12);
  var OSM='&copy; OpenStreetMap contributors';
  var providers=[
    {url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',sub:'a',attr:OSM,max:19,name:'street'},
    {url:'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',sub:'abc',attr:OSM+', HOT / OSM France',max:19,name:'street'}
  ];
  var ROADS=${roads};
  var idx=0, tiles=null, offline=null, loaded=false, errors=0, timer=null;
  function next(){ idx++; start(); }
  function start(){
    if(tiles){ map.removeLayer(tiles); tiles=null; }
    clearTimeout(timer); loaded=false; errors=0;
    if(idx>=providers.length){ goOffline(); return; }
    var p=providers[idx];
    tiles=L.tileLayer(p.url,{subdomains:p.sub,attribution:p.attr,maxZoom:p.max});
    tiles.on('tileload',function(){ if(!loaded){ loaded=true; post({type:'basemap',mode:'street'}); } });
    tiles.on('tileerror',function(){ errors++; if(!loaded && errors>=6) next(); });
    tiles.addTo(map);
    timer=setTimeout(function(){ if(!loaded) next(); },8000);
  }
  function goOffline(){
    if(offline) return;
    offline=L.layerGroup();
    ROADS.forEach(function(l){ L.polyline(l,{color:'#CDD5E0',weight:8,interactive:false}).addTo(offline); L.polyline(l,{color:'#fff',weight:5,interactive:false}).addTo(offline); });
    offline.addTo(map);
    map.attributionControl.setPrefix('Offline map: saved roads only');
    post({type:'basemap',mode:'offline'});
  }
  start();

  var layers=L.layerGroup().addTo(map), fitted=false;
  var STATUS={OPEN:'#047857',FULL:'#B45309',STANDBY:'#475569',CLOSED:'#B91C1C'};
  window.fw={
    setData:function(d){
      layers.clearLayers();
      (d.zones||[]).forEach(function(z){
        var c=L.circle([z.lat,z.lon],{radius:z.radiusM,color:z.color,weight:2,fillColor:z.color,fillOpacity:z.kind==='demo'?0.06:0.22,dashArray:z.kind==='demo'?'6 6':null});
        var el=document.createElement('b'); el.textContent=z.label; c.bindPopup(el); c.addTo(layers);
      });
      (d.shelters||[]).forEach(function(s){
        var m=L.circleMarker([s.lat,s.lon],{radius:11,color:'#fff',weight:3,fillColor:STATUS[s.status]||'#475569',fillOpacity:1});
        m.on('click',function(){ post({type:'shelter',id:s.id}); }); m.addTo(layers);
      });
      if(d.you){ L.marker([d.you.lat,d.you.lon],{icon:L.divIcon({className:'',html:'<div class="you"></div>',iconSize:[18,18],iconAnchor:[9,9]}),interactive:false}).addTo(layers); }
      if(!fitted && d.fit && d.fit.length){ fitted=true; map.fitBounds(L.latLngBounds(d.fit).pad(0.15),{maxZoom:14}); }
    },
    centre:function(lat,lon){ map.setView([lat,lon],15,{animate:true}); }
  };
  post({type:'ready'});
})();
</script></body></html>`;

let cached: string | null = null;
/** Built once: the HTML is about 200 KB, mostly Leaflet and the roads. */
export function mapHtml(): string {
  cached ??= page(JSON.stringify(OFFLINE_ROADS));
  return cached;
}
