/* Shared French playback. Keep the active utterance alive until completion. */
(function(root){
 let active=null,sequence=0,voiceTimer=null,startTimer=null,resumeTimer=null,removeVoiceListener=null;
 function clear(){clearTimeout(voiceTimer);clearTimeout(startTimer);clearInterval(resumeTimer);removeVoiceListener?.();removeVoiceListener=null;}
 function stop(){sequence++;clear();active=null;try{root.speechSynthesis?.cancel();}catch{}}
 function play(text,options={}){
  stop();const token=sequence,synth=root.speechSynthesis,notify=options.status||(()=>{});
  if(!synth||!root.SpeechSynthesisUtterance){notify('Audio is unavailable here. Open VocaRealm directly in a browser with French speech support.');options.onError?.('unsupported');return false;}
  text=String(text||'').trim();if(!text){notify('There is no French text to play.');return false;}
  let launched=false;
  function fail(reason){if(token!==sequence)return;clear();active=null;notify('French audio could not play. Try Listen again. If it stays silent, open VocaRealm directly in your browser and enable a French system voice.');options.onError?.(reason);}
  function launch(){if(launched||token!==sequence)return;launched=true;clearTimeout(voiceTimer);removeVoiceListener?.();removeVoiceListener=null;
   try{const voices=synth.getVoices(),french=voices.filter(v=>/^fr(?:-|_)/i.test(v.lang)||v.lang==='fr');const selected=french.find(v=>v.name===options.voiceName)||french[(options.actor||0)%Math.max(french.length,1)]||null;
    active=new root.SpeechSynthesisUtterance(text);const u=active;u.lang=selected?.lang||'fr-FR';if(selected)u.voice=selected;u.rate=options.rate||.85;
    u.onstart=()=>{if(token!==sequence)return;clearTimeout(startTimer);notify('Playing French audio…');options.onStart?.();};
    u.onend=()=>{if(token!==sequence)return;clear();active=null;notify('Audio finished.');options.onEnd?.();};
    u.onerror=e=>{if(token===sequence&&!['canceled','interrupted'].includes(e.error))fail(e.error);};
    notify('Preparing French audio…');startTimer=setTimeout(()=>{if(token!==sequence)return;try{synth.cancel();}catch{}fail('start-timeout');},8000);
    // Safari/Chromium can retain a paused synthesizer after a cancelled line.
    synth.resume();synth.speak(u);resumeTimer=setInterval(()=>{if(token===sequence&&synth.paused)synth.resume();},1000);
   }catch(e){fail('speech-error');}
  }
  notify('Loading French audio…');
  // Voice lists are populated asynchronously on several browsers.
  try{if(synth.getVoices().length)launch();else{const ready=()=>{if(synth.getVoices().length)launch();};synth.addEventListener?.('voiceschanged',ready);removeVoiceListener=()=>synth.removeEventListener?.('voiceschanged',ready);voiceTimer=setTimeout(launch,1000);}}catch{fail('voice-error');}
  return true;
 }
 root.VocaFrenchAudio={play,stop};root.addEventListener?.('pagehide',stop);
})(window);
