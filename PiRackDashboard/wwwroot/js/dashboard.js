let tempChart, fanChart, hours=24;
const tempFields=[['rackTop','Rack Top'],['rackBottom','Rack Bottom'],['ux7Cpu','UX7 CPU'],['ux7Board','UX7 Board'],['unvrCpu','UNVR CPU'],['unvrBoard','UNVR Board']];
const fanFields=[['Ft','FT'],['Fb','FB'],['Fl','FL'],['Fr','FR'],['E1','E1'],['E4','E4']];
const fmt=v=>v==null?'—':Number(v).toFixed(1)+'°C';

function normalizeStatus(rawStatus, timestamp){
    const ageSeconds=Math.floor(Date.now()/1000)-Number(timestamp||0);
    if(ageSeconds>120) return 'OFFLINE';
    const status=String(rawStatus||'').toUpperCase();
    if(status==='OK') return 'NORMAL';
    if(status==='WARN') return 'WARNING';
    if(status==='NORMAL'||status==='WARNING'||status==='CRITICAL') return status;
    return 'OFFLINE';
}

async function latest(){
    const r=await fetch('/api/telemetry/latest');
    const d=await r.json();
    if(!d)return;
    tempFields.forEach(([k])=>document.getElementById(k).textContent=fmt(d[k]));
    const s=document.getElementById('status');
    const status=normalizeStatus(d.status,d.timestamp);
    s.textContent=status;
    s.className='status '+status.toLowerCase();
    document.getElementById('lastUpdate').textContent='Last sample: '+new Date(d.timestamp*1000).toLocaleString([], { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
    document.getElementById('fans').innerHTML=fanFields.map(([k,n]) =>
      `<div class="fan"><span>${n}</span><b>${d['fan'+k+'Pct']==null?'—':Math.round(d['fan'+k+'Pct'])+'%'}</b><span>${d['fan'+k+'Rpm']==null?'RPM —':Math.round(d['fan'+k+'Rpm'])+' RPM'}</span></div>`).join('');
}

async function history(){
    const r=await fetch('/api/telemetry/history?hours='+hours);
    const d=await r.json();
    const labels=d.map(x=>{
      const dt=new Date(x.timestamp*1000);
      return hours<=24
        ? dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})
        : dt.toLocaleDateString([], {month:'short',day:'numeric'});
    });
    const common={
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{position:'bottom'},
        tooltip:{
          callbacks:{
            title:items=>{
              const i=items?.[0]?.dataIndex;
              if(i==null)return '';
              return new Date(d[i].timestamp*1000).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false});
            }
          }
        }
      },
      scales:{
        x:{ticks:{autoSkip:true,maxTicksLimit:hours<=6?12:hours<=24?10:8,maxRotation:0,minRotation:0}}
      }
    };
    if(tempChart)tempChart.destroy();   
    tempChart=new Chart(document.getElementById('tempChart'),{
      type:'line',
      data:{labels,datasets:tempFields.map(([k,n])=>({label:n,data:d.map(x=>x[k]),pointRadius:0,borderWidth:2,tension:.15}))},
      options:{...common,scales:{...common.scales,y:{suggestedMin:20,suggestedMax:100,title:{display:true,text:'°C'}}}}
    });
    if(fanChart)fanChart.destroy();
    fanChart=new Chart(document.getElementById('fanChart'),{
      type:'line',
      data:{labels,datasets:fanFields.slice(0,4).map(([k,n])=>({label:n+' %',data:d.map(x=>x['fan'+k+'Pct']),pointRadius:0,borderWidth:2,tension:.15}))},
      options:{...common,scales:{...common.scales,y:{min:0,max:100,title:{display:true,text:'Fan %'}}}}
    });
}

document.querySelectorAll('[data-hours]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-hours]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); hours=Number(b.dataset.hours); history();
});
latest(); history();
setInterval(latest,10000);
setInterval(history,60000);