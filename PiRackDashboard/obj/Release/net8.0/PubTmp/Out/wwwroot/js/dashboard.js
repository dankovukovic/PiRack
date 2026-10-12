let tempChart, fanChart, hours=24;
const tempFields=[['rackTop','Rack Top'],['rackBottom','Rack Bottom'],['ux7Cpu','UX7 CPU'],['ux7Board','UX7 Board'],['uswpro8TempMax','USW Pro8'],['unvrCpu','UNVR CPU'],['unvrBoard','UNVR Board']];
const fanFields=[['Ft','FT'],['Fb','FB'],['Fl','FL'],['Fr','FR'],['E1','E1'],['E4','E4']];
const fmt=v=>v==null?'—':Number(v).toFixed(1)+'°C';
const minGapThresholdMs=2*60*1000;

function formatXAxis(tsMs){
    const dt=new Date(tsMs);
    return hours<=24
      ? dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false})
      : dt.toLocaleDateString([], {month:'short',day:'numeric'})+' '+dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false});
}

function detectGapThresholdMs(rows){
    if(!rows||rows.length<3) return minGapThresholdMs;
    const deltas=[];
    for(let i=1;i<rows.length;i++){
      const delta=(rows[i].timestamp-rows[i-1].timestamp)*1000;
      if(delta>0) deltas.push(delta);
    }
    if(deltas.length===0) return minGapThresholdMs;
    deltas.sort((a,b)=>a-b);
    const median=deltas[Math.floor(deltas.length/2)];
    return Math.max(minGapThresholdMs, median*2.5);
}

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
    const gapThresholdMs=detectGapThresholdMs(d);
    const xTickLimit=hours<=6?12:hours<=24?10:8;
    const xMin=d.length>0?d[0].timestamp*1000:Date.now()-(hours*3600*1000);
    const xMax=d.length>0?d[d.length-1].timestamp*1000:Date.now();
    const common={
      responsive:true,
      maintainAspectRatio:false,
      animation:false,
      interaction:{mode:'index',intersect:false},
      plugins:{
        legend:{position:'bottom'},
        tooltip:{
          callbacks:{
            title:items=>items?.[0]?.parsed?.x
              ? new Date(items[0].parsed.x).toLocaleString([], {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})
              : ''
          }
        }
      },
      scales:{
        x:{
          type:'linear',
          bounds:'data',
          min:xMin,
          max:xMax,
          ticks:{
            autoSkip:true,
            maxTicksLimit:xTickLimit,
            maxRotation:0,
            minRotation:0,
            callback:value=>formatXAxis(Number(value))
          }
        }
      }
    };
    if(tempChart)tempChart.destroy();   
    tempChart=new Chart(document.getElementById('tempChart'),{
      type:'line',
      data:{datasets:tempFields.map(([k,n])=>({
        label:n,
        data:d.map(x=>({x:x.timestamp*1000,y:x[k]})),
        pointRadius:0,
        borderWidth:2,
        tension:.15,
        segment:{
          borderColor:ctx=>(ctx.p1.parsed.x-ctx.p0.parsed.x)>gapThresholdMs?'#8f98a3':undefined,
          borderDash:ctx=>(ctx.p1.parsed.x-ctx.p0.parsed.x)>gapThresholdMs?[6,6]:undefined
        }
      }))},
      options:{...common,scales:{...common.scales,y:{suggestedMin:20,suggestedMax:100,title:{display:true,text:'°C'}}}}
    });
    if(fanChart)fanChart.destroy();
    fanChart=new Chart(document.getElementById('fanChart'),{
      type:'line',
      data:{datasets:fanFields.slice(0,4).map(([k,n])=>({
        label:n+' %',
        data:d.map(x=>({x:x.timestamp*1000,y:x['fan'+k+'Pct']})),
        pointRadius:0,
        borderWidth:2,
        tension:.15,
        segment:{
          borderColor:ctx=>(ctx.p1.parsed.x-ctx.p0.parsed.x)>gapThresholdMs?'#8f98a3':undefined,
          borderDash:ctx=>(ctx.p1.parsed.x-ctx.p0.parsed.x)>gapThresholdMs?[6,6]:undefined
        }
      }))},
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