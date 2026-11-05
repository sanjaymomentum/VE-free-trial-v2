(function(){
  'use strict';
  var screens=Array.prototype.slice.call(document.querySelectorAll('.screen'));
  var current='step-one';
  function go(id){
    var target=document.getElementById(id); if(!target)return;
    screens.forEach(function(screen){screen.classList.remove('active');});
    current=id; target.classList.add('active'); window.scrollTo({top:0,behavior:'smooth'});
  }
  document.querySelectorAll('[data-go]').forEach(function(button){button.addEventListener('click',function(){go(button.dataset.go);});});

  // A single linear animation drives both the CTA fill and its 30-second countdown.
  var totalMs=30000, remainingMs=totalMs, startedAt=0, paused=false, started=false, animation=null, countdown=null;
  var fill=document.getElementById('progress-fill'), timer=document.getElementById('timer'), pauseButton=document.getElementById('pause');
  function format(ms){var seconds=Math.ceil(ms/1000);return '00:'+String(seconds).padStart(2,'0');}
  function paintTimer(){timer.textContent=paused?'Paused':'Auto-continue in '+format(remainingMs);}
  function stopProgress(){if(countdown)clearInterval(countdown);countdown=null;if(animation){animation.cancel();animation=null;}}
  function startProgress(){
    if(started)return;
    started=true;paused=false;remainingMs=totalMs;fill.style.width='0%';pauseButton.textContent='Click to Pause';pauseButton.setAttribute('aria-pressed','false');paintTimer();
    if(fill.animate){animation=fill.animate([{width:'0%'},{width:'100%'}],{duration:totalMs,easing:'linear',fill:'forwards'});}
    startedAt=performance.now();
    function complete(){if(paused||current!=='step-one')return;remainingMs=0;paintTimer();stopProgress();go('step-two');}
    if(animation)animation.onfinish=complete;
    countdown=setInterval(function(){if(paused||current!=='step-one')return;var now=performance.now();remainingMs=Math.max(0,remainingMs-(now-startedAt));startedAt=now;paintTimer();if(remainingMs===0)complete();},1000);
  }
  pauseButton.addEventListener('click',function(){if(current!=='step-one'||!started)return;var now=performance.now();if(!paused){remainingMs=Math.max(0,remainingMs-(now-startedAt));paused=true;if(animation)animation.pause();}else{paused=false;startedAt=now;if(animation)animation.play();}pauseButton.textContent=paused?'Resume':'Click to Pause';pauseButton.setAttribute('aria-pressed',String(paused));paintTimer();});
  document.getElementById('start-trial').addEventListener('click',function(){if(current!=='step-one')return;stopProgress();paused=false;remainingMs=0;go('step-two');});

  var phoneInput=document.querySelector('input[name="phone"]');
  phoneInput.addEventListener('beforeinput',function(e){if((e.inputType==='insertText'||e.inputType==='insertReplacementText')&&e.data&&/[^0-9]/.test(e.data))e.preventDefault();});
  phoneInput.addEventListener('paste',function(e){var clipboard=e.clipboardData||window.clipboardData;if(!clipboard)return;var pasted=clipboard.getData('text'),digits=pasted.replace(/\D/g,'');if(pasted!==digits){e.preventDefault();var start=phoneInput.selectionStart,end=phoneInput.selectionEnd;phoneInput.setRangeText(digits,start,end,'end');phoneInput.dispatchEvent(new Event('input',{bubbles:true}));}});
  phoneInput.addEventListener('input',function(){var before=phoneInput.value,caret=phoneInput.selectionStart,digits=before.replace(/\D/g,''),digitsBefore=before.slice(0,caret).replace(/\D/g,'').length;if(before!==digits){phoneInput.value=digits;phoneInput.setSelectionRange(digitsBefore,digitsBefore);}});

  var calendar=document.getElementById('calendar'),monthLabel=document.getElementById('month-label'),dayGrid=document.getElementById('days'),dateTrigger=document.getElementById('date-trigger'),dateField=dateTrigger.closest('.date-field'),startDateInput=document.getElementById('start-date-value');
  document.body.appendChild(calendar);
  var today=localToday(),dateWindow=getDateWindow(today),view=new Date(dateWindow.start.getFullYear(),dateWindow.start.getMonth(),1),selectedDate=null;
  function localToday(){var now=new Date();return new Date(now.getFullYear(),now.getMonth(),now.getDate());}
  function shiftDate(date,days){var shifted=new Date(date.getFullYear(),date.getMonth(),date.getDate());shifted.setDate(shifted.getDate()+days);return shifted;}
  function getDateWindow(base){return{start:shiftDate(base,1),end:shiftDate(base,30)};}
  function workingDate(d){return d.getDay()!==0&&d.getDay()!==6;}
  function isSelectableDate(d){return workingDate(d)&&d>=dateWindow.start&&d<=dateWindow.end;}
  function calendarMotion(el){el.classList.remove('calendar-enter');void el.offsetWidth;el.classList.add('calendar-enter');}
  function tenthWorkingDay(start){var d=new Date(start.getFullYear(),start.getMonth(),start.getDate()),count=0;while(count<10){if(workingDate(d))count++;if(count<10)d.setDate(d.getDate()+1);}return d;}
  function shortDate(d){return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});}
  function isoDate(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function getFormStartDate(){
    var match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(startDateInput.value);
    if(!match)return null;
    var date=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
    if(isoDate(date)!==startDateInput.value||!isSelectableDate(date))return null;
    return date;
  }
  function clearDateError(){var error=dateField.querySelector('.error');if(error)error.remove();}
  function monthIndex(d){return d.getFullYear()*12+d.getMonth();}
  function updateMonthNavigation(){
    document.getElementById('prev').disabled=monthIndex(view)<=monthIndex(dateWindow.start);
    document.getElementById('next').disabled=monthIndex(view)>=monthIndex(dateWindow.end);
  }
  function positionCalendar(){
    if(calendar.hidden)return;
    var anchor=dateTrigger.getBoundingClientRect(),gutter=8,viewportHeight=window.innerHeight,viewportWidth=window.innerWidth;
    var width=Math.min(anchor.width,Math.max(0,viewportWidth-16)),left=Math.min(Math.max(anchor.left,8),Math.max(8,viewportWidth-width-8));
    calendar.style.width=width+'px';calendar.style.left=left+'px';calendar.style.top='0px';calendar.style.maxHeight='';calendar.style.overflowY='';
    var naturalHeight=calendar.getBoundingClientRect().height,below=Math.max(0,viewportHeight-anchor.bottom-gutter*2),above=Math.max(0,anchor.top-gutter*2);
    var openAbove=below<naturalHeight&&above>below,available=openAbove?above:below;
    calendar.dataset.placement=openAbove?'above':'below';
    if(naturalHeight>available){calendar.style.maxHeight=Math.max(0,available)+'px';calendar.style.overflowY='auto';}
    var height=calendar.getBoundingClientRect().height;
    var top=openAbove?anchor.top-height-gutter:anchor.bottom+gutter;
    calendar.style.top=Math.max(0,Math.min(top,viewportHeight-height))+'px';
  }
  function clearStartDate(){selectedDate=null;startDateInput.value='';dateTrigger.classList.remove('has-date');document.getElementById('date-label').textContent='DD/MM/YYYY';document.getElementById('schedule-card').hidden=true;document.getElementById('confirmed-dates').textContent='Select a start date';}
  function updateStartDate(date){
    if(!date||!isSelectableDate(date)){clearStartDate();return;}
    selectedDate=new Date(date.getFullYear(),date.getMonth(),date.getDate());
    startDateInput.value=isoDate(selectedDate);
    dateTrigger.classList.add('has-date');
    document.getElementById('date-label').textContent=[String(date.getDate()).padStart(2,'0'),String(date.getMonth()+1).padStart(2,'0'),date.getFullYear()].join('/');
    var end=tenthWorkingDay(selectedDate);
    document.getElementById('schedule').textContent=shortDate(selectedDate)+' – '+shortDate(end);
    document.getElementById('schedule-card').hidden=false;
    document.getElementById('confirmed-dates').innerHTML=shortDate(selectedDate)+' – '+shortDate(end)+' <span>(10 working days)</span>';
    clearDateError();
  }
  function refreshDateWindow(){
    var currentToday=localToday();
    if(currentToday.getTime()===today.getTime())return false;
    today=currentToday;dateWindow=getDateWindow(today);
    if(monthIndex(view)<monthIndex(dateWindow.start)||monthIndex(view)>monthIndex(dateWindow.end))view=new Date(dateWindow.start.getFullYear(),dateWindow.start.getMonth(),1);
    if(startDateInput.value&&!getFormStartDate())clearStartDate();
    return true;
  }
  function renderCalendar(){
    refreshDateWindow();
    var y=view.getFullYear(),m=view.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,last=new Date(y,m+1,0).getDate();
    monthLabel.textContent=view.toLocaleDateString('en-US',{month:'long',year:'numeric'});updateMonthNavigation();dayGrid.innerHTML='';
    ['MON','TUE','WED','THU','FRI','SAT','SUN'].forEach(function(d){var s=document.createElement('span');s.className='dow';s.textContent=d;dayGrid.appendChild(s);});
    for(var i=0;i<first;i++)dayGrid.appendChild(document.createElement('span'));
    for(var n=1;n<=last;n++){(function(day){var date=new Date(y,m,day),b=document.createElement('button');b.type='button';b.textContent=day;b.setAttribute('aria-label',date.toDateString());b.disabled=!isSelectableDate(date);var formDate=getFormStartDate();if(formDate&&formDate.getTime()===date.getTime())b.classList.add('selected');b.addEventListener('click',function(){if(!isSelectableDate(date))return;var currentDate=getFormStartDate();if(currentDate&&currentDate.getTime()===date.getTime())clearStartDate();else updateStartDate(date);renderCalendar();calendar.hidden=true;dateTrigger.setAttribute('aria-expanded','false');});dayGrid.appendChild(b);})(n);}
    calendarMotion(dayGrid);
    if(!calendar.hidden)positionCalendar();
  }
  renderCalendar();
  window.setInterval(function(){if(refreshDateWindow()&&!calendar.hidden)renderCalendar();},60000);
  dateTrigger.setAttribute('aria-expanded','false');
  dateTrigger.addEventListener('click',function(){calendar.hidden=!calendar.hidden;dateTrigger.setAttribute('aria-expanded',String(!calendar.hidden));if(!calendar.hidden)renderCalendar();});
  document.getElementById('prev').addEventListener('click',function(){if(monthIndex(view)<=monthIndex(dateWindow.start))return;view.setMonth(view.getMonth()-1);renderCalendar();});
  document.getElementById('next').addEventListener('click',function(){if(monthIndex(view)>=monthIndex(dateWindow.end))return;view.setMonth(view.getMonth()+1);renderCalendar();});
  document.addEventListener('click',function(e){if(!dateField.contains(e.target)&&!calendar.contains(e.target)){calendar.hidden=true;dateTrigger.setAttribute('aria-expanded','false');}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!calendar.hidden){calendar.hidden=true;dateTrigger.setAttribute('aria-expanded','false');}});
  window.addEventListener('resize',positionCalendar);
  window.addEventListener('scroll',positionCalendar,true);
  if(window.visualViewport){window.visualViewport.addEventListener('resize',positionCalendar);window.visualViewport.addEventListener('scroll',positionCalendar);}
  document.getElementById('trial-form').addEventListener('submit',function(e){e.preventDefault();var form=e.currentTarget;form.querySelectorAll('.error').forEach(function(x){x.remove();});if(!form.reportValidity())return;var formDate=getFormStartDate();if(!formDate){clearStartDate();var err=document.createElement('p');err.className='error';err.textContent='Please select a start date.';dateTrigger.after(err);return;}selectedDate=formDate;go('confirmation');});

  var overlay=document.getElementById('modal'),modalContent=document.getElementById('modal-content');
  var uploadedFiles=[],projectDescription='',activePreviewUrls=[];
  function getPreviewUrl(file){
    for(var i=0;i<activePreviewUrls.length;i++)if(activePreviewUrls[i].file===file)return activePreviewUrls[i].url;
    var url=URL.createObjectURL(file);activePreviewUrls.push({file:file,url:url});return url;
  }
  function revokeFilePreview(file){
    activePreviewUrls=activePreviewUrls.filter(function(entry){if(entry.file!==file)return true;URL.revokeObjectURL(entry.url);return false;});
  }
  function revokeFilePreviewUrls(){activePreviewUrls.forEach(function(entry){URL.revokeObjectURL(entry.url);});activePreviewUrls=[];}
  window.addEventListener('beforeunload',revokeFilePreviewUrls);
  var meetingDate=new Date(2026,10,3),meetingView=new Date(2026,10,1),meetingTime='10:00 AM',meetingMode='Microsoft Teams';
  function openModal(kind){
    overlay.classList.toggle('brief-overlay',kind==='brief');overlay.classList.toggle('schedule-overlay',kind==='schedule');overlay.classList.toggle('send-overlay',kind==='send-work');
    var shellClose=overlay.querySelector('.modal > .close');if(shellClose)shellClose.hidden=kind==='brief';
    if(kind==='send-work')renderSendWork();else if(kind==='schedule')renderMeeting();else renderBrief();
    overlay.hidden=false;document.body.classList.add('modal-open');
  }
  function renderSendWork(){
    modalContent.innerHTML='<div class="send-modal"><h2 id="modal-title">Send Your Work</h2><p class="description">Share your project details and files to get started.</p><label>Tell us about your project *<textarea id="project-text" placeholder="Describe the work you need help with, your requirements, goals, and expected deliverables."></textarea></label><label class="upload" id="upload-box"><img src="assets/upload-cloud.svg" alt=""><b>Choose a file or Drag it here</b><small>Supported: PDF, Word, Excel, PowerPoint, images, MP4 and MP3 · up to 10 MB max</small><input id="project-files" type="file" multiple accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.tif,.tiff,.pdf,.doc,.docx,.docm,.rtf,.xls,.xlsx,.xlsm,.ppt,.pptx,.pptm,.csv,.mp4,.mov,.m4v,.webm,.mp3,.wav,.m4a,.ogg,.flac,.zip,.rar,.7z,.tar,.gz,.txt"></label><div id="file-list" hidden></div><button class="primary" id="submit-work">Submit Project</button></div>';
    var input=document.getElementById('project-files'),box=document.getElementById('upload-box'),fileList=document.getElementById('file-list');
    var projectText=document.getElementById('project-text');projectText.value=projectDescription;
    projectText.addEventListener('input',function(){projectDescription=projectText.value;});
    syncFileInput();renderFileRows();
    box.addEventListener('click',function(e){if(e.target!==input)input.click();});box.addEventListener('dragover',function(e){e.preventDefault();box.classList.add('dragging');});box.addEventListener('dragleave',function(){box.classList.remove('dragging');});box.addEventListener('drop',function(e){e.preventDefault();box.classList.remove('dragging');showFiles(e.dataTransfer.files);});
    input.addEventListener('change',function(){if(input.files.length)showFiles(input.files);});
    function showFiles(files){
      revokeFilePreviewUrls();
      uploadedFiles=Array.prototype.slice.call(files);
      syncFileInput();
      renderFileRows();
    }
    function renderFileRows(){
      fileList.innerHTML='';
      fileList.hidden=uploadedFiles.length===0;
      uploadedFiles.forEach(function(file,index){
        var previewUrl=getPreviewUrl(file);
        var row=document.createElement('div');row.className='file-row';
        var icon=createFileIcon(file,previewUrl);
        var name=document.createElement('span');name.className='file-name';name.textContent=file.name;
        var separator=document.createElement('span');separator.setAttribute('aria-hidden','true');separator.textContent='•';
        var preview=document.createElement('a');preview.href=previewUrl;preview.target='_blank';preview.rel='noopener';preview.textContent='Preview';
        var size=document.createElement('span');size.className='file-size';size.textContent=formatFileSize(file.size);
        var remove=document.createElement('button');remove.className='remove-file';remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Remove '+file.name);
        remove.addEventListener('click',function(){revokeFilePreview(file);uploadedFiles.splice(index,1);syncFileInput();renderFileRows();});
        row.append(icon,name,separator,preview,size,remove);fileList.appendChild(row);
      });
    }
    function createFileIcon(file,previewUrl){
      var ext=file.name.indexOf('.')>-1?file.name.split('.').pop().toLowerCase():'';
      var category,label;
      if(ext==='pdf'||file.type==='application/pdf'){var pdf=document.createElement('img');pdf.src='assets/pdf.svg';pdf.alt='PDF';return pdf;}
      if(/^(doc|docx|rtf)$/.test(ext)||/msword|wordprocessingml/.test(file.type)){category='word';label='DOC';}
      else if(/^(xls|xlsx|xlsm|csv)$/.test(ext)||/spreadsheet|excel/.test(file.type)){category='excel';label='XLS';}
      else if(/^(ppt|pptx|pptm)$/.test(ext)||/presentation|powerpoint/.test(file.type)){category='powerpoint';label='PPT';}
      else if(file.type.indexOf('image/')===0||/^(png|jpe?g|gif|webp|svg|bmp|tiff?)$/.test(ext)){var thumb=document.createElement('img');thumb.className='file-thumbnail';thumb.src=previewUrl;thumb.alt='Image preview';return thumb;}
      else if(file.type.indexOf('video/')===0||/^(mp4|mov|webm|m4v)$/.test(ext)){category='video';label='VID';}
      else if(file.type.indexOf('audio/')===0||/^(mp3|wav|m4a|ogg|flac)$/.test(ext)){category='audio';label='AUD';}
      else if(/^(zip|rar|7z|tar|gz)$/.test(ext)){category='archive';label='ZIP';}
      else{category='generic';label='FILE';}
      var badge=document.createElement('span');badge.className='file-type-icon file-type-'+category;badge.textContent=label;badge.setAttribute('aria-label',label+' file');return badge;
    }
    function formatFileSize(bytes){if(bytes<1024)return bytes+' B';if(bytes<1048576)return (bytes/1024).toFixed(1).replace(/\.0$/,'')+' KB';return (bytes/1048576).toFixed(1).replace(/\.0$/,'')+' MB';}
    function syncFileInput(){try{var transfer=new DataTransfer();uploadedFiles.forEach(function(file){transfer.items.add(file);});input.files=transfer.files;}catch(error){/* The visible selection remains in sync where DataTransfer is unavailable. */}}
    document.getElementById('submit-work').addEventListener('click',function(){var text=document.getElementById('project-text');projectDescription=text.value;if(!text.value.trim()){text.focus();text.setCustomValidity('Please describe your project.');text.reportValidity();text.addEventListener('input',function(){text.setCustomValidity('');},{once:true});return;}closeModal();showWorkSubmitted();});
  }
  function renderMeeting(){
    modalContent.innerHTML='<div class="schedule-modal"><h2 id="modal-title">Schedule Kickoff Meeting</h2><p class="description">Choose a time that works for you.</p><div class="meeting-grid"><div class="meeting-calendar"><div class="cal-head"><button id="meet-prev" aria-label="Previous month"><img src="assets/arrow-left.svg" alt=""></button><b id="meet-month"></b><button id="meet-next" aria-label="Next month"><img src="assets/arrow-right.svg" alt=""></button></div><div class="days" id="meet-days"></div><p class="calendar-note">Saturdays and Sundays are unavailable.</p></div><div class="time-panel"><h3 id="selected-meet-date"></h3><div class="time-options" id="time-options"></div></div></div><div class="meeting-modes"><p>Meet with</p><div class="mode-options"><button class="selected" data-mode="Microsoft Teams"><img src="assets/meeting-teams.svg" alt="">Microsoft Teams</button><button data-mode="Google Meet"><img src="assets/meeting-google.svg" alt="">Google Meet</button><button data-mode="WhatsApp"><img src="assets/meeting-whatsapp.svg" alt="">WhatsApp</button></div></div><button class="primary" id="confirm-meeting">Confirm Meeting</button></div>';
    drawMeetingCalendar();
    document.getElementById('meet-prev').addEventListener('click',function(){meetingView.setMonth(meetingView.getMonth()-1);drawMeetingCalendar();});document.getElementById('meet-next').addEventListener('click',function(){meetingView.setMonth(meetingView.getMonth()+1);drawMeetingCalendar();});
    var times=[];for(var h=9;h<=16;h++){for(var min=0;min<60;min+=15){var hour=h>12?h-12:h;times.push(hour+':'+String(min).padStart(2,'0')+' '+(h>=12?'PM':'AM'));}}
    var opts=document.getElementById('time-options');times.forEach(function(t){var b=document.createElement('button');b.type='button';b.textContent=t;if(t===meetingTime)b.classList.add('selected');b.addEventListener('click',function(){meetingTime=t;opts.querySelectorAll('button').forEach(function(x){x.classList.toggle('selected',x===b);});});opts.appendChild(b);});
    document.querySelectorAll('.mode-options button').forEach(function(b){b.addEventListener('click',function(){meetingMode=b.dataset.mode;document.querySelectorAll('.mode-options button').forEach(function(x){x.classList.toggle('selected',x===b);});});});
    document.getElementById('confirm-meeting').addEventListener('click',function(){if(!meetingDate||!workingDate(meetingDate)){return;}closeModal();showMeetingScheduled();});
  }
  function drawMeetingCalendar(){
    var y=meetingView.getFullYear(),m=meetingView.getMonth(),first=new Date(y,m,1).getDay(),last=new Date(y,m+1,0).getDate(),grid=document.getElementById('meet-days');if(!grid)return;document.getElementById('meet-month').textContent=meetingView.toLocaleDateString('en-US',{month:'long',year:'numeric'});grid.innerHTML='';['SUN','MON','TUE','WED','THU','FRI','SAT'].forEach(function(s){var d=document.createElement('span');d.className='dow';d.textContent=s;grid.appendChild(d);});for(var i=0;i<first;i++)grid.appendChild(document.createElement('span'));for(var day=1;day<=last;day++){(function(n){var date=new Date(y,m,n),b=document.createElement('button');b.type='button';b.textContent=n;b.disabled=!workingDate(date);if(meetingDate&&date.toDateString()===meetingDate.toDateString())b.classList.add('selected');b.addEventListener('click',function(){meetingDate=date;drawMeetingCalendar();});grid.appendChild(b);})(day);}calendarMotion(grid);var dText=document.getElementById('selected-meet-date');if(dText)dText.textContent=meetingDate.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  }
  function renderBrief(){
    modalContent.innerHTML='';
    var header=document.createElement('div');header.className='brief-header';
    var titleBlock=document.createElement('div'),title=document.createElement('h2'),employee=document.createElement('p');
    title.id='modal-title';title.textContent='Project Brief';
    var activeScreen=document.getElementById(current)||document.getElementById('confirmation');
    var developer=activeScreen.querySelector('.developer-row')||document.querySelector('#confirmation .developer-row');
    var developerName=developer&&developer.querySelector('h2')?developer.querySelector('h2').textContent.trim():'';
    var roleLine=developer&&developer.querySelector('p')?developer.querySelector('p').textContent.trim():'';
    var designation=roleLine.split(' · ')[0].trim();
    employee.textContent=[developerName,designation].filter(Boolean).join(' · ');
    titleBlock.append(title,employee);
    var close=document.createElement('button');close.className='close';close.type='button';close.setAttribute('aria-label','Close');
    var closeIcon=document.createElement('img');closeIcon.src='assets/close.svg';closeIcon.alt='';close.appendChild(closeIcon);
    header.append(titleBlock,close);
    var body=document.createElement('div');body.className='brief-body';
    if(projectDescription.trim()){
      var overviewTitle=document.createElement('h3'),overview=document.createElement('p');
      overviewTitle.textContent='Project Overview:';overview.className='project-overview';overview.textContent=projectDescription;
      body.append(overviewTitle,overview);
    }
    if(uploadedFiles.length){
      var filesTitle=document.createElement('h3');filesTitle.className='files-title';filesTitle.textContent='Supporting Documents/Files';body.appendChild(filesTitle);
      uploadedFiles.forEach(function(file){var link=document.createElement('a');link.textContent=file.name;link.href=getPreviewUrl(file);link.target='_blank';link.rel='noopener';body.appendChild(link);});
    }
    modalContent.append(header,body);
    body.hidden=!projectDescription.trim()&&!uploadedFiles.length;
  }
  function closeModal(){overlay.hidden=true;document.body.classList.remove('modal-open');}
  function bindModalButtons(root){root.querySelectorAll('[data-modal]').forEach(function(button){button.addEventListener('click',function(){openModal(button.dataset.modal);});});}
  function showWorkSubmitted(){var source=document.querySelector('#'+current+' .confirm-content')||document.querySelector('#confirmation .confirm-content');var content=source.cloneNode(true);content.querySelector('#initial-actions').hidden=true;content.querySelector('#work-actions').hidden=false;var calendarIcon=content.querySelector('#work-actions img');if(calendarIcon)calendarIcon.src='assets/calendar-white.svg';content.querySelector('.project-status').hidden=false;document.getElementById('confirmation-work').replaceChildren(content);bindModalButtons(content);go('confirmation-work');}
  function showMeetingScheduled(){var source=document.querySelector('#'+current+' .confirm-content')||document.querySelector('#confirmation .confirm-content');var content=source.cloneNode(true);content.querySelector('.project-status').hidden=false;content.querySelector('.meeting-status').hidden=false;content.querySelector('#initial-actions').hidden=true;content.querySelector('#work-actions').hidden=true;var date=meetingDate.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});content.querySelector('.meeting-status b').textContent=date+' · '+meetingTime+' ('+meetingMode+')';document.getElementById('confirmation-meeting').replaceChildren(content);bindModalButtons(content);go('confirmation-meeting');}
  function setupConfirmationVariant(){var base=document.querySelector('#confirmation .confirm-content');document.getElementById('confirmation-work').innerHTML=base.outerHTML;document.getElementById('confirmation-meeting').innerHTML=base.outerHTML;}
  setupConfirmationVariant();
  // Keep the confirmation details and status view identical to Figma's three designed states.
  document.querySelectorAll('[data-modal]').forEach(function(button){button.addEventListener('click',function(){openModal(button.dataset.modal);});});
  overlay.addEventListener('click',function(e){if(e.target===overlay||e.target.closest('.close'))closeModal();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!overlay.hidden)closeModal();});
  startProgress();
})();
