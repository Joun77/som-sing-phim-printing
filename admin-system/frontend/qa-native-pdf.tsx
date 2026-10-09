import React,{useState,useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import Lightbox from './src/components/common/UniversalViewer';
import {useAuthStore} from './src/store/useAuthStore';
import './src/i18n';
import './src/index.css';
const src='/api/v1/orders/files/orders/qa-range-original.pdf';
function Probe(){
 const [open,setOpen]=useState(false);const [report,setReport]=useState<any>(null);const start=useRef(0);
 useEffect(()=>{if(!open)return;let doc:any=null,scheduled=false,done=false;const resources=()=>performance.getEntriesByType('resource').filter((e:any)=>e.name.includes(src)&&e.startTime>=start.current).map((e:any)=>({start_ms:e.startTime-start.current,ready_ms:e.responseEnd-start.current,duration_ms:e.duration,encoded_body_bytes:e.encodedBodySize,transfer_bytes:e.transferSize}));
 const observer=new MutationObserver(()=>{if(doc===null&&document.querySelector('[data-testid="pdf-viewer"]'))doc=performance.now()-start.current;const canvas=document.querySelector('[data-testid="pdf-canvas-preview"] canvas:not([hidden])') as HTMLCanvasElement|null;if(!done&&!scheduled&&canvas&&canvas.width>0){scheduled=true;requestAnimationFrame(()=>requestAnimationFrame(()=>{done=true;setReport({document_visible_ms:doc,canvas_visible_after_two_frames_ms:performance.now()-start.current,bytes_completed_at_canvas:resources().reduce((sum:number,e:any)=>sum+e.encoded_body_bytes,0),resources:resources(),canvas_width:canvas.width,canvas_height:canvas.height,source_bytes:12586195});}));}});
 observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','width','height']});return()=>observer.disconnect();},[open]);
 return <main className="p-6"><button style={{position:"fixed",top:4,left:4,zIndex:2147483647,background:"white",padding:8,border:"1px solid black"}} onClick={()=>useAuthStore.getState().logout()}>ອອກຈາກລະບົບ QA</button><h1>ທົດສອບ PDF ຈຳລອງ</h1><p>12,586,195 bytes • SHA256 41d4281f…afb2</p><button className="border p-3" onClick={()=>{start.current=performance.now();setReport(null);setOpen(true)}}>ເປີດ PDF ທົດສອບ</button><pre id="qa-pdf-measurement" className="whitespace-pre-wrap">{report?JSON.stringify(report,null,2):'ຍັງບໍ່ມີຜົນ'}</pre>{open&&<Lightbox src={src} fileName="qa-range-original.pdf" fileSize={12586195} contentType="application/pdf" language="lo" onClose={()=>setOpen(false)}/>}</main>;
}
createRoot(document.getElementById('root')!).render(<Probe/>);
