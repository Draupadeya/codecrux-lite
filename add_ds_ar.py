with open('frontend/index.html', 'r') as f:
    content = f.read()

pos = content.rfind('</script>')

functions = '''

        // DATA STRUCTURE AR/VR VISUALIZATION FOR PRACTICE LABS
        const dsVisualizationMap = {'arrays':{'name':'Array','color':0x6366f1,'shape':'boxes'},'linked-list':{'name':'Linked List','color':0x22c55e,'shape':'chain'},'tree':{'name':'Binary Tree','color':0x0ea5e9,'shape':'tree'},'graph':{'name':'Graph','color':0xf59e0b,'shape':'network'},'hash':{'name':'Hash Map','color':0xef4444,'shape':'scatter'},'stack':{'name':'Stack','color':0xec4899,'shape':'column'},'queue':{'name':'Queue','color':0x8b5cf6,'shape':'row'}};
        function openDataStructureAR(){const qt=document.getElementById('dsa-question-title')?.textContent||'Two Sum';const cat=document.getElementById('dsa-category')?.textContent||'Arrays';const code=document.getElementById('labs-code-input')?.value||'';const dsType='arrays';const dsInfo=dsVisualizationMap[dsType];const overlay=document.createElement('div');overlay.id='ds-ar-overlay';overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:10001;display:flex;flex-direction:column;justify-content:space-between;padding:20px;font-family:sans-serif;';overlay.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;"><h2 style="color:#e5e7eb;font-size:22px;margin:0;">🕶️ '+dsInfo.name+' AR Visualization</h2><button id="close-ds-ar" style="background:#ef4444;color:#fff;border:none;padding:10px 20px;border-radius:10px;cursor:pointer;">Close AR</button></div><div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0;"><div style="background:#111827;border:2px solid #334155;border-radius:12px;"><canvas id="ds-ar-canvas" style="width:100%;height:100%;display:block;"></canvas></div><div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:20px;color:#cbd5e1;"><h3 style="margin:0 0 12px 0;color:#e5e7eb;">'+dsInfo.name+'</h3><p style="font-size:13px;color:#9ca3af;margin:0 0 12px 0;">AR/VR visualization</p><button onclick="rotateDS3DLeft()" style="width:100%;background:#0ea5e9;color:#fff;border:none;padding:8px;margin-bottom:8px;border-radius:8px;cursor:pointer;font-weight:600;">↶ Rotate</button><button onclick="zoomDS3DIn()" style="width:100%;background:#22c55e;color:#0b172a;border:none;padding:8px;border-radius:8px;cursor:pointer;font-weight:700;">🔍 Zoom</button></div></div>';document.body.appendChild(overlay);overlay.querySelector('#close-ds-ar').onclick=()=>overlay.remove();initDS3DVisualization(dsType,dsInfo.color);}
        function initDS3DVisualization(dsType,color){const canvas=document.getElementById('ds-ar-canvas');if(!canvas)return;window.dsScene=new THREE.Scene();window.dsCamera=new THREE.PerspectiveCamera(75,canvas.clientWidth/canvas.clientHeight,0.1,1000);window.dsRenderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});window.dsRenderer.setSize(canvas.clientWidth,canvas.clientHeight);window.dsRenderer.setClearColor(0x111827,1);window.dsCamera.position.z=6;const light=new THREE.PointLight(0xffffff,1.2);light.position.set(8,8,8);window.dsScene.add(light);const ambientLight=new THREE.AmbientLight(0x404040,0.8);window.dsScene.add(ambientLight);createDSGeometry(dsType,color);const animate=()=>{requestAnimationFrame(animate);window.dsScene.children.forEach(child=>{if(child instanceof THREE.Mesh){child.rotation.x+=0.002;child.rotation.y+=0.003;}});window.dsRenderer.render(window.dsScene,window.dsCamera);};animate();}
        function createDSGeometry(dsType,baseColor){if(dsType==='arrays'){for(let i=0;i<5;i++){const geom=new THREE.BoxGeometry(0.8,0.8,0.8);const mat=new THREE.MeshPhongMaterial({color:baseColor});const mesh=new THREE.Mesh(geom,mat);mesh.position.x=(i-2)*1.2;window.dsScene.add(mesh);}}}
        function rotateDS3DLeft(){if(window.dsCamera)window.dsCamera.position.x-=2;}
        function zoomDS3DIn(){if(window.dsCamera)window.dsCamera.position.z-=1;}
'''

new_content = content[:pos] + functions + content[pos:]
with open('frontend/index.html', 'w') as f:
    f.write(new_content)

print('SUCCESS: Added DS AR/VR functions to index.html')
