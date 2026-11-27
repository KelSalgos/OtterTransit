const $=id=>document.getElementById(id);
const MAP_URL='https://transport.opendata.ch/examples/map.html';
const views={board:['boardView','tabBoard'],journey:['journeyView','tabJourney'],radar:['radarView','tabRadar']};
let active='board';
function unmount(){ $('radarFrameHost').replaceChildren(); }
function mount(){
  if(active!=='radar'||document.hidden||$('radarFrameHost').firstChild)return;
  const frame=document.createElement('iframe');
  frame.title='Carte des transports suisses — Transport API';
  frame.referrerPolicy='no-referrer';
  frame.src=MAP_URL;
  $('radarFrameHost').append(frame);
}
function show(view){
  active=view;
  for(const [key,[panel,tab]] of Object.entries(views)){
    $(panel).hidden=key!==view;
    $(tab).setAttribute('aria-pressed',String(key===view));
  }
  if(view==='radar')mount();else unmount();
  document.dispatchEvent(new CustomEvent('otter:view',{detail:view}));
}
for(const [key,[,tab]] of Object.entries(views))$(tab).addEventListener('click',()=>show(key));
$('radarReload').addEventListener('click',()=>{unmount();mount()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)unmount();else mount()});
