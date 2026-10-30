/* One lexical scope for inherited classification and current request evidence. */
const ARC89_SCENE=arc79Scene;
arc79Scene=function(question,override='auto'){
 const parsed=ARC89_SCENE(question,override),scene=parsed.scene,model=scene.arc82;
 let inherited=scene;
 const scope=ARCANA_LEXICAL_CONTEXT.focusedScope(model.question,model);
 if(override==='auto'&&scope.start)inherited=ARC89_SCENE(model.question.slice(scope.start,scope.end),override).scene;
 const lexical=ARCANA_LEXICAL_CONTEXT.resolve(model.question,model,inherited.domain,inherited.medical,text=>ARC89_SCENE(text,override).scene);
 if(lexical){scene.lexical=lexical;scene.medical=lexical.medical||scene.urgent;if(scene.medical)scene.domain='health';else if(override==='auto')scene.domain=lexical.domain;}
 return parsed;
};
const arc89LanguageStatus=document.createElement('p');arc89LanguageStatus.id='arc89LanguageStatus';arc89LanguageStatus.hidden=true;arc89LanguageStatus.setAttribute('role','status');$('question').after(arc89LanguageStatus);
$('question').addEventListener('input',()=>{const status=ARCANA_KOREAN_MORPHOLOGY.status();arc89LanguageStatus.hidden=!status.failed;arc89LanguageStatus.textContent=status.failed?'이 브라우저에서 문장 분석을 시작하지 못해 기본 분석을 사용하고 있습니다. 앱을 다시 열어 확인해 주세요.':'';});
const arc89Sources=document.createElement('details');arc89Sources.className='arc-web-panel';const arc89Summary=document.createElement('summary');arc89Summary.textContent='언어 분석의 출처와 라이선스';const arc89Notices=document.createElement('pre');arc89Notices.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 system-ui';arc89Notices.textContent=ARCANA_MORPHOLOGY_NOTICES;arc89Sources.append(arc89Summary,arc89Notices);document.querySelector('#about .about-content').append(arc89Sources);
