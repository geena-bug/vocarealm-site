(function(root){
 const codes=['A1','A2','B1','B2','C1','C2'];
 function stageScore(answers,level){return answers.filter(a=>a.level===level&&a.correct===true).length;}
 function decide(answers){let recommended='A1',passed=[];for(const code of codes){const rows=answers.filter(a=>a.level===code);if(rows.length!==6)break;if(stageScore(answers,code)<5)return {recommended:code,passed,complete:true};passed.push(code);recommended=codes[Math.min(codes.indexOf(code)+1,5)];}return {recommended,passed,complete:passed.includes('C2')};}
 function validateAttempt(a,bank){if(!a||a.version!==1||!Array.isArray(a.answers)||a.answers.length>36||!Array.isArray(a.orders)||a.orders.length!==36)return false;return a.answers.every((r,i)=>r.level===codes[Math.floor(i/6)]&&r.index===i%6&&(r.choice===null||(Number.isInteger(r.choice)&&r.choice>=0&&r.choice<bank[r.level][r.index].options.length)))&&a.orders.every(o=>Array.isArray(o)&&o.length===4&&[0,1,2,3].every(n=>o.includes(n)));}
 function normalizedAnswers(attempt,bank){return attempt.answers.map(r=>({...r,correct:r.choice===bank[r.level][r.index].answer}));}
 const api={codes,stageScore,decide,validateAttempt,normalizedAnswers};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VocaLevelCore=api;
})(typeof window==='undefined'?null:window);
