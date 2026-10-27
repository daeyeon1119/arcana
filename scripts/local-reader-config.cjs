/* Fixed free resources and fixture boundaries. No network, runtime launch or model download. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
function setup(argv=[]){
 const known=/^--(?:profile=|run=|cases=|limit=|fixture=|staged$|separated$|describe$)/;
 for(const arg of argv)assert(known.test(arg),'Unknown diagnostic option: '+arg);
 const get=name=>{const args=argv.filter(a=>a.startsWith('--'+name+'='));assert(args.length<=1,'Duplicate diagnostic option: '+name);if(args.length){const value=args[0].slice(name.length+3);assert(value.length,'Empty diagnostic option: '+name);return value;}};
 const profileId=get('profile')??'qwen3-4b',profiles=json('scripts/local-reader-profiles.json');
 assert(Object.hasOwn(profiles,profileId),'Unknown local model profile');
 const profile=profiles[profileId],resources=json('scripts/local-reader-resources.json');
 if(profile.model)resources.model=profile.model;
 const staged=argv.includes('--staged'),separated=argv.includes('--separated'),runTag=get('run'),selectedIds=get('cases')?.split(',');
 assert(!(staged&&separated),'Choose one interpretation protocol');
 if(runTag!==undefined)assert(/^[a-z0-9][a-z0-9-]{0,50}$/.test(runTag),'Invalid run directory name');
 const fixturePath=path.resolve(root,get('fixture')||'tests/local-reader-first.json'),testRoot=fs.realpathSync(path.join(root,'tests'));
 assert(fixturePath.endsWith('.json')&&fs.realpathSync(fixturePath).startsWith(testRoot+path.sep),'Fixture must be a project tests/*.json file');
 const fixture=JSON.parse(fs.readFileSync(fixturePath,'utf8')),ids=new Set(),cardIds=new Set(json('assets/rws/manifest.json').cards.map(c=>c.id));
 assert(Array.isArray(fixture.cases)&&fixture.cases.length>0&&fixture.cases.length<=1000,'Invalid fixture cases');
 for(const c of fixture.cases){assert(c&&/^[a-zA-Z0-9_-]{1,60}$/.test(c.id)&&!ids.has(c.id),'Invalid or duplicate case ID');ids.add(c.id);assert(typeof c.question==='string'&&c.question.length<=500&&typeof c.spread==='string','Invalid question or spread');assert(Array.isArray(c.cards)&&c.cards.length>=1&&c.cards.length<=10&&c.cards.every(d=>Array.isArray(d)&&d.length===2&&cardIds.has(d[0])&&typeof d[1]==='boolean')&&new Set(c.cards.map(d=>d[0])).size===c.cards.length,'Invalid fixed cards');}
 if(selectedIds)assert(selectedIds.length&&new Set(selectedIds).size===selectedIds.length&&selectedIds.every(id=>ids.has(id)),'Unknown or duplicate selected case');
 const limit=get('limit')===undefined?fixture.cases.length:Number(get('limit'));assert(Number.isInteger(limit)&&limit>=1&&limit<=fixture.cases.length,'Invalid case limit');
 const baseFolder=separated?'native-'+profileId+'-separated-first':profileId==='qwen3-4b'?(staged?'native-staged-first':'native-first'):'native-'+profileId+(staged?'-staged':'')+'-first';
 return {profileId,profile,resources,fixture,fixturePath,staged,separated,runTag,selectedIds,limit,describe:argv.includes('--describe'),folder:'test-results/local-reader/'+baseFolder+(runTag?'/'+runTag:''),cache:path.join(root,'.cache/local-reader')};
}
function freezeFor(config,hashes){
 const {profileId,profile,resources,staged,separated,selectedIds,limit,fixture}=config;
 const freeze={appSHA256:hashes.app,contractSHA256:hashes.contract,fixtureSHA256:hashes.fixture,runtime:resources.runtime,model:resources.model,temperature:0.4,top_p:0.9,max_tokens:1800,seed:830027,context:8192,threads:4};
 if(profileId!=='qwen3-4b')Object.assign(freeze,{profile:profileId,context:profile.context,generation:profile.generation,temperature:profile.generation.temperature,top_p:profile.generation.top_p});
 if(staged)Object.assign(freeze,{plannerSHA256:hashes.planner,planTemperature:0.2,planMaxTokens:600,stages:['question-without-cards','grounded-reading']});
 if(separated)Object.assign(freeze,{separatorSHA256:hashes.separator,draftTemperature:0.2,draftMaxTokens:1000,stages:['question-help-without-cards','symbolic-reflection']});
 if(selectedIds)freeze.selectedCaseIds=selectedIds;
 if(limit!==fixture.cases.length)freeze.caseLimit=limit;
 return freeze;
}
module.exports={setup,freezeFor};
