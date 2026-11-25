
"use strict";
const $=id=>document.getElementById(id);
const steps=[
 ["1. Choose an Amazon Machine Image (AMI)","An AMI is the starting template: operating system and initial software. We will use a Linux image."],
 ["2. Choose an instance type","The instance type determines the virtual CPU, memory and other capabilities. Bigger types usually cost more."],
 ["3. Choose how to log in","A key pair can authenticate an SSH connection. Keep its private key secret; AWS does not need your private key file."],
 ["4. Configure the network","A VPC is your private network in AWS. A public subnet can route through an internet gateway; inbound security-group rules control access."],
 ["5. Add block storage","Amazon EBS volumes act like disks attached to your instance. EBS-backed data normally survives a stop/start."],
 ["6. Review and launch","Review the settings, then click Launch demo. This runs a local simulation; it does not access AWS."]
];
let wizard=0,config={ami:"Amazon Linux 2023",type:"t3.micro",key:"demo-key.pem",public:true,ebs:20},rules={ssh:true,http:false,https:true},state="idle";
const choice=(icon,title,detail,attr,val,active)=>'<button class="choice" '+attr+'="'+val+'" aria-pressed="'+String(active)+'"><span class="icon" aria-hidden="true">'+icon+'</span><strong>'+title+'</strong><small>'+detail+'</small></button>';
function renderWizard(){
 const info=steps[wizard];$('wizardCounter').textContent='Step '+(wizard+1)+' / 6';
 document.querySelectorAll('[data-step]').forEach(b=>{if(+b.dataset.step===wizard)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current')});
 let body='';
 if(wizard===0){body='<div class="optionGrid">'+choice('🐧','Amazon Linux 2023','AWS-maintained Linux distribution','data-ami','Amazon Linux 2023',config.ami==='Amazon Linux 2023')+choice('🐧','Ubuntu Server','Popular Linux distribution','data-ami','Ubuntu Server',config.ami==='Ubuntu Server')+'</div><div class="note">An AMI is a reusable template. Selecting a Linux AMI here does not install anything on your own computer.</div>'}
 else if(wizard===1){body='<div class="optionGrid">'+choice('⚙️','t3.micro','Example: 2 vCPU · 1 GiB memory','data-type','t3.micro',config.type==='t3.micro')+choice('🚀','t3.small','Example: 2 vCPU · 2 GiB memory','data-type','t3.small',config.type==='t3.small')+'</div><div class="note">CPU and memory are examples from the T3 family. Actual cost and Free Tier eligibility depend on account, Region and offer — not shown here.</div>'}
 else if(wizard===2){body='<div class="flow"><div class="flowbox blue">🔑<br>Private key<br><small>Stays with you</small></div><div class="flowarrow">↔</div><div class="flowbox orange">🖥️<br>EC2 instance<br><small>Public key</small></div></div><div class="note green">Use an authorized key or another supported connection method. Never paste a private key into chat, code repositories, or websites.</div>'}
 else if(wizard===3){body='<div class="flow"><div class="flowbox">🌍 Internet</div><div class="flowarrow">→</div><div class="flowbox blue">VPC<br><small>Public subnet</small></div><div class="flowarrow">→</div><div class="flowbox orange">🛡️ SG + EC2</div></div><div style="margin-top:15px" class="optionGrid">'+choice('🌐','Public web demo','Use a public address and a reachable subnet','data-public','true',config.public)+choice('🔒','Private server','Keep the instance without direct public access','data-public','false',!config.public)+'</div><div class="note">A public address alone is not enough: routing, security-group rules and the app itself must also be configured.</div>'}
 else if(wizard===4){body='<div class="flow"><div class="flowbox orange">🖥️ EC2</div><div class="flowarrow">↔</div><div class="flowbox blue">💽 EBS<br><small>gp3 volume</small></div></div><div style="margin-top:17px" class="between"><label for="storageRange"><strong>Root volume size</strong></label><output id="storageVal" style="color:var(--orange);font-weight:900">'+config.ebs+' GiB</output></div><input id="storageRange" type="range" min="10" max="50" step="10" value="'+config.ebs+'" style="width:100%;accent-color:var(--orange);margin:12px 0"><div class="note">Storage is billed separately from EC2 compute. A normal stop keeps the attached EBS root volume.</div>'}
 else{body='<div class="summary">'+[
 ['AMI',config.ami],['Instance type',config.type],['Login method','Key pair (example)'],['Network',config.public?'Public-subnet demo':'Private-subnet demo'],['Root storage',config.ebs+' GiB gp3'],['Region','Choose in real AWS console']
 ].map(([a,b])=>'<div class="summaryLine"><small>'+a+'</small><b>'+b+'</b></div>').join('')+'</div><div class="note green">Everything here is a local educational simulator — clicking Launch will not create an instance or charge an AWS account.</div><button class="btn orange wide" data-launch style="margin-top:12px">'+(state==='idle'||state==='terminated'?'🚀 Launch demo instance':'↻ Relaunch demo instance')+'</button>'}
 $('wizardBody').innerHTML='<h3 class="stageTitle">'+info[0]+'</h3><p class="stageDesc">'+info[1]+'</p><div class="stageArea">'+body+'</div>';
 $('backStep').disabled=wizard===0;
 $('nextStep').textContent=wizard===5?'↻ Start walkthrough':'Next step →';
}
document.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{wizard=+b.dataset.step;renderWizard()}));
$('backStep').addEventListener('click',()=>{wizard=Math.max(0,wizard-1);renderWizard()});
$('nextStep').addEventListener('click',()=>{wizard=(wizard+1)%6;renderWizard()});
$('wizardBody').addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 if('ami' in b.dataset)config.ami=b.dataset.ami;
 if('type' in b.dataset)config.type=b.dataset.type;
 if('public' in b.dataset)config.public=b.dataset.public==='true';
 if(b.hasAttribute('data-launch')){state='running';renderLifecycle()}
 renderWizard();
});
$('wizardBody').addEventListener('input',e=>{if(e.target.id==='storageRange'){config.ebs=+e.target.value;$('storageVal').textContent=config.ebs+' GiB'}});
function testSecurity(){
 const kind=$('testPort').value,source=$('testSource').value;
 const titles={ssh:'SSH · 22',http:'HTTP · 80',https:'HTTPS · 443'};
 const allowed=rules[kind]&&(kind!=='ssh'||source==='myip');
 $('requestInfo').textContent=(source==='myip'?'Approved IP':'Internet')+' · '+titles[kind];
 $('trafficArrow').className='sgarrow '+(allowed?'allowed':'denied');
 $('trafficArrow').textContent=allowed?'→':'✕';
 const result=$('testResult');
 result.className='checkResult '+(allowed?'allowed':'denied');
 result.textContent=allowed?'✓ Rule allows '+titles[kind]+' from '+(source==='myip'?'your approved IP':'the internet')
 :'✕ Rule blocks '+titles[kind]+' from '+(source==='myip'?'your approved IP':'the internet');
}
document.querySelectorAll('[data-rule]').forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.rule;rules[k]=!rules[k];b.setAttribute('aria-pressed',String(rules[k]));testSecurity()}));
$('testPort').addEventListener('change',testSecurity);$('testSource').addEventListener('change',testSecurity);
function renderLifecycle(){
 const labels={idle:'Not launched',running:'Running',stopped:'Stopped',terminated:'Terminated'};
 $('liveState').className='inlineStatus '+state;$('liveState').innerHTML='<span class="dot"></span> '+labels[state];
 $('machineIcon').className='machine '+state;
 $('machineIcon').textContent=state==='running'?'🟢':state==='stopped'?'⏸️':state==='terminated'?'🗑️':'🖥️';
 $('machineTitle').textContent=state==='running'?'Demo server is running':state==='stopped'?'Demo server is stopped':state==='terminated'?'Demo server was terminated':'No instance yet';
 $('machineSub').textContent=state==='running'?'Virtual compute is active':state==='stopped'?'EBS-backed data remains':state==='terminated'?'Re-launch to create a new demo':'Click Launch to begin';
 $('computeBill').textContent=state==='running'?'Compute usage billed':state==='stopped'?'No regular compute charge':state==='terminated'?'Ended':'Not billed — no instance';
 $('storageBill').textContent=state==='running'||state==='stopped'?config.ebs+' GiB EBS — still billed':state==='terminated'?'Root volume deleted (demo default)':'Not provisioned';
 $('ipBill').textContent=state==='running'?'Public IPv4 may cost':state==='stopped'?'Allocated addresses may cost':state==='terminated'?'Released unless separately allocated':'May cost when allocated';
 $('startBtn').textContent=state==='stopped'?'▶ Start':state==='running'?'Running':'🚀 Launch';
 $('startBtn').disabled=state==='running';
 $('stopBtn').disabled=state!=='running';$('terminateBtn').disabled=state==='idle'||state==='terminated';
 $('lifeNote').className='note '+(state==='running'?'green':state==='terminated'?'red':'');
 $('lifeNote').textContent={
 idle:'Start by launching a simulated EC2 instance. No real AWS resources or charges are created here.',
 running:'Running: compute resources are active. EBS and other resources may be billed separately.',
 stopped:'Stopped: normal On-Demand compute usage stops, but EBS storage remains allocated and can still be billed. A new public IPv4 address may be assigned at the next start.',
 terminated:'Terminated: the instance cannot restart. This demo deletes the root EBS volume by default. In real AWS, preserved volumes can continue billing.'
 }[state];
}
$('startBtn').addEventListener('click',()=>{if(state!=='running'){state='running';renderLifecycle();renderWizard()}});
$('stopBtn').addEventListener('click',()=>{if(state==='running'){state='stopped';renderLifecycle()}});
$('terminateBtn').addEventListener('click',()=>{if(state!=='idle'&&state!=='terminated'){state='terminated';renderLifecycle();renderWizard()}});
$('resetBtn').addEventListener('click',()=>{state='idle';renderLifecycle();renderWizard()});
renderWizard();testSecurity();renderLifecycle();
