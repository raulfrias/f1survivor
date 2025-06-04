(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))a(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const n of s.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&a(n)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function a(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();const b=[{id:"aus-2025",location:"Melbourne",raceName:"Australian GP",country:"Australia",circuit:"Melbourne",date:"2025-03-16",timeLocal:"15:00",timeGMT:"04:00",dateStart:"2025-03-16T04:00:00+00:00",round:1},{id:"chn-2025",location:"Shanghai",raceName:"Chinese GP",country:"China",circuit:"Shanghai",date:"2025-03-23",timeLocal:"15:00",timeGMT:"07:00",dateStart:"2025-03-23T07:00:00+00:00",round:2},{id:"jpn-2025",location:"Suzuka",raceName:"Japanese GP",country:"Japan",circuit:"Suzuka",date:"2025-04-06",timeLocal:"14:00",timeGMT:"05:00",dateStart:"2025-04-06T05:00:00+00:00",round:3},{id:"bhr-2025",location:"Sakhir",raceName:"Bahrain GP",country:"Bahrain",circuit:"Sakhir",date:"2025-04-13",timeLocal:"18:00",timeGMT:"15:00",dateStart:"2025-04-13T15:00:00+00:00",round:4},{id:"sau-2025",location:"Jeddah",raceName:"Saudi Arabian GP",country:"Saudi Arabia",circuit:"Jeddah",date:"2025-04-20",timeLocal:"20:00",timeGMT:"17:00",dateStart:"2025-04-20T17:00:00+00:00",round:5},{id:"mia-2025",location:"Miami",raceName:"Miami GP",country:"United States",circuit:"Miami",date:"2025-05-04",timeLocal:"16:00",timeGMT:"20:00",dateStart:"2025-05-04T20:00:00+00:00",round:6},{id:"emi-2025",location:"Imola",raceName:"Emilia-Romagna GP",country:"Italy",circuit:"Imola",date:"2025-05-18",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-05-18T13:00:00+00:00",round:7},{id:"mon-2025",location:"Monaco",raceName:"Monaco GP",country:"Monaco",circuit:"Monaco",date:"2025-05-25",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-05-25T13:00:00+00:00",round:8},{id:"esp-2025",location:"Barcelona",raceName:"Spanish GP",country:"Spain",circuit:"Barcelona",date:"2025-06-01",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-06-01T13:00:00+00:00",round:9},{id:"can-2025",location:"Montreal",raceName:"Canadian GP",country:"Canada",circuit:"Montreal",date:"2025-06-15",timeLocal:"14:00",timeGMT:"18:00",dateStart:"2025-06-15T18:00:00+00:00",round:10},{id:"aut-2025",location:"Spielberg",raceName:"Austrian GP",country:"Austria",circuit:"Red Bull Ring",date:"2025-06-29",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-06-29T13:00:00+00:00",round:11},{id:"gbr-2025",location:"Silverstone",raceName:"British GP",country:"Great Britain",circuit:"Silverstone",date:"2025-07-06",timeLocal:"15:00",timeGMT:"14:00",dateStart:"2025-07-06T14:00:00+00:00",round:12},{id:"bel-2025",location:"Spa",raceName:"Belgian GP",country:"Belgium",circuit:"Spa-Francorchamps",date:"2025-07-27",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-07-27T13:00:00+00:00",round:13},{id:"hun-2025",location:"Budapest",raceName:"Hungarian GP",country:"Hungary",circuit:"Hungaroring",date:"2025-08-03",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-08-03T13:00:00+00:00",round:14},{id:"ned-2025",location:"Zandvoort",raceName:"Dutch GP",country:"Netherlands",circuit:"Zandvoort",date:"2025-08-31",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-08-31T13:00:00+00:00",round:15},{id:"ita-2025",location:"Monza",raceName:"Italian GP",country:"Italy",circuit:"Monza",date:"2025-09-07",timeLocal:"15:00",timeGMT:"13:00",dateStart:"2025-09-07T13:00:00+00:00",round:16},{id:"aze-2025",location:"Baku",raceName:"Azerbaijan GP",country:"Azerbaijan",circuit:"Baku",date:"2025-09-21",timeLocal:"15:00",timeGMT:"11:00",dateStart:"2025-09-21T11:00:00+00:00",round:17},{id:"sgp-2025",location:"Singapore",raceName:"Singapore GP",country:"Singapore",circuit:"Marina Bay",date:"2025-10-05",timeLocal:"20:00",timeGMT:"12:00",dateStart:"2025-10-05T12:00:00+00:00",round:18},{id:"usa-2025",location:"Austin",raceName:"United States GP",country:"United States",circuit:"COTA",date:"2025-10-19",timeLocal:"14:00",timeGMT:"19:00",dateStart:"2025-10-19T19:00:00+00:00",round:19},{id:"mex-2025",location:"Mexico City",raceName:"Mexico City GP",country:"Mexico",circuit:"Mexico City",date:"2025-10-26",timeLocal:"14:00",timeGMT:"20:00",dateStart:"2025-10-26T20:00:00+00:00",round:20},{id:"bra-2025",location:"São Paulo",raceName:"São Paulo GP",country:"Brazil",circuit:"Interlagos",date:"2025-11-09",timeLocal:"14:00",timeGMT:"17:00",dateStart:"2025-11-09T17:00:00+00:00",round:21},{id:"lv-2025",location:"Las Vegas",raceName:"Las Vegas GP",country:"United States",circuit:"Las Vegas",date:"2025-11-22",timeLocal:"20:00",timeGMT:"04:00",dateStart:"2025-11-23T04:00:00+00:00",round:22},{id:"qat-2025",location:"Lusail",raceName:"Qatar GP",country:"Qatar",circuit:"Lusail",date:"2025-11-30",timeLocal:"19:00",timeGMT:"16:00",dateStart:"2025-11-30T16:00:00+00:00",round:23},{id:"uae-2025",location:"Abu Dhabi",raceName:"Abu Dhabi GP",country:"United Arab Emirates",circuit:"Yas Marina",date:"2025-12-07",timeLocal:"17:00",timeGMT:"13:00",dateStart:"2025-12-07T13:00:00+00:00",round:24}];function k(o=new Date){const e=b.filter(t=>new Date(t.dateStart)>o);return e.length===0?null:e.sort((t,a)=>new Date(t.dateStart)-new Date(a.dateStart))[0]}const q=Object.freeze(Object.defineProperty({__proto__:null,F1_2025_CALENDAR:b,getNextRace:k},Symbol.toStringTag,{value:"Module"})),I="modulepreload",A=function(o,e){return new URL(o,e).href},S={},P=function(e,t,a){let r=Promise.resolve();if(t&&t.length>0){let n=function(d){return Promise.all(d.map(u=>Promise.resolve(u).then(g=>({status:"fulfilled",value:g}),g=>({status:"rejected",reason:g}))))};const i=document.getElementsByTagName("link"),c=document.querySelector("meta[property=csp-nonce]"),l=(c==null?void 0:c.nonce)||(c==null?void 0:c.getAttribute("nonce"));r=n(t.map(d=>{if(d=A(d,a),d in S)return;S[d]=!0;const u=d.endsWith(".css"),g=u?'[rel="stylesheet"]':"";if(!!a)for(let v=i.length-1;v>=0;v--){const f=i[v];if(f.href===d&&(!u||f.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${d}"]${g}`))return;const m=document.createElement("link");if(m.rel=u?"stylesheet":I,u||(m.as="script"),m.crossOrigin="",m.href=d,l&&m.setAttribute("nonce",l),document.head.appendChild(m),u)return new Promise((v,f)=>{m.addEventListener("load",v),m.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${d}`)))})}))}function s(n){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=n,window.dispatchEvent(i),!i.defaultPrevented)throw n}return r.then(n=>{for(const i of n||[])i.status==="rejected"&&s(i.reason);return e().catch(s)})},p={USER_PICKS:"f1survivor_user_picks",CURRENT_SEASON:"f1survivor_season",USER_SETTINGS:"f1survivor_settings"};function y(o,e=null){try{let t=L();console.log("Existing picks before save:",t),Array.isArray(t)||(console.log("Converting existing picks to array"),t=[]);const a=JSON.parse(localStorage.getItem("nextRaceData"));if(!a||!a.raceId)throw new Error("No valid race data found. Cannot save pick.");const r={driverId:parseInt(o),timestamp:new Date().toISOString(),raceId:a.raceId,driverName:(e==null?void 0:e.driverName)||null,teamName:(e==null?void 0:e.teamName)||null,isAutoPick:(e==null?void 0:e.isAutoPick)||!1},s=t.findIndex(i=>i.raceId===a.raceId);s!==-1?(t[s]=r,console.log("Updated existing pick for race:",a.raceId)):(t.push(r),console.log("Added new pick for race:",a.raceId));const n={userId:"local-user",currentSeason:h(),picks:t};return console.log("Saving picks data:",n),localStorage.setItem(p.USER_PICKS,JSON.stringify(n)),r}catch(t){throw console.error("Failed to save picks to localStorage:",t),t}}function L(){try{const o=localStorage.getItem(p.USER_PICKS);if(!o)return[];const e=JSON.parse(o);return e.currentSeason!==h()?[]:e.picks?Array.isArray(e.picks)?e.picks:typeof e.picks=="object"&&e.picks.driverId?[e.picks]:typeof e.picks=="number"?[{driverId:e.picks,timestamp:new Date().toISOString()}]:[]:[]}catch(o){return console.error("Failed to load picks from localStorage:",o),[]}}function h(){return"2025"}function T(o){try{const e=L();if(!Array.isArray(e))return console.error("Picks is not an array:",e),!1;const t=e.some(a=>a.driverId===o);return console.log(`Checking if driver ${o} is picked:`,t),t}catch(e){return console.error("Error checking if driver is picked:",e),!1}}function C(){try{return localStorage.removeItem(p.USER_PICKS),!0}catch(o){return console.error("Failed to clear pick data:",o),!1}}function U(){try{const o=JSON.parse(localStorage.getItem("nextRaceData"));return o&&L().find(t=>t.raceId===o.raceId)||null}catch(o){return console.error("Failed to get current race pick:",o),null}}function N(){try{const o=localStorage.getItem("f1survivor_user_picks"),e=o?JSON.parse(o):{userId:"local-user",currentSeason:"2025",picks:[]},t=[{raceId:"bhr-2025",driverId:1,driverName:"Max Verstappen",teamName:"Red Bull Racing",timestamp:"2025-03-02T12:00:00.000Z",isAutoPick:!1},{raceId:"sau-2025",driverId:7,driverName:"Lando Norris",teamName:"McLaren",timestamp:"2025-03-09T12:00:00.000Z",isAutoPick:!1}];return e.picks=[...t,...e.picks],localStorage.setItem("f1survivor_user_picks",JSON.stringify(e)),console.log("Test previous race picks added successfully"),!0}catch(o){return console.error("Failed to add test previous race picks:",o),!1}}const x=Object.freeze(Object.defineProperty({__proto__:null,STORAGE_KEYS:p,addTestPreviousRacePicks:N,clearPickData:C,getCurrentRacePick:U,getCurrentSeason:h,isDriverAlreadyPicked:T,loadUserPicks:L,saveUserPicks:y},Symbol.toStringTag,{value:"Module"})),D={...p,USER_LEAGUES:"f1survivor_user_leagues",LEAGUE_DATA:"f1survivor_league_data",ACTIVE_LEAGUE:"f1survivor_active_league",USER_ID:"f1survivor_user_id",USER_NAME:"f1survivor_user_name"};class _{constructor(){this.STORAGE_KEYS=D,this.currentUserId=this.getCurrentUserId()}getCurrentUserId(){let e=localStorage.getItem(this.STORAGE_KEYS.USER_ID);return e||(e=`user_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,localStorage.setItem(this.STORAGE_KEYS.USER_ID,e)),e}getCurrentUsername(){let e=localStorage.getItem(this.STORAGE_KEYS.USER_NAME);return e||(e=`Player${Math.floor(Math.random()*1e4)}`,localStorage.setItem(this.STORAGE_KEYS.USER_NAME,e)),e}setUsername(e){localStorage.setItem(this.STORAGE_KEYS.USER_NAME,e)}getAllLeagues(){try{const e=localStorage.getItem(this.STORAGE_KEYS.LEAGUE_DATA);return e?JSON.parse(e):{}}catch(e){return console.error("Failed to load leagues:",e),{}}}getLeague(e){return this.getAllLeagues()[e]||null}saveLeague(e){try{const t=this.getAllLeagues();return t[e.leagueId]=e,localStorage.setItem(this.STORAGE_KEYS.LEAGUE_DATA,JSON.stringify(t)),!0}catch(t){return console.error("Failed to save league:",t),!1}}getUserLeagueData(){try{const e=localStorage.getItem(this.STORAGE_KEYS.USER_LEAGUES);return e?JSON.parse(e):{userId:this.currentUserId,currentSeason:h(),activeLeagueId:null,leagues:[],createdLeagues:[]}}catch(e){return console.error("Failed to load user league data:",e),{userId:this.currentUserId,currentSeason:h(),activeLeagueId:null,leagues:[],createdLeagues:[]}}}saveUserLeagueData(e){try{return localStorage.setItem(this.STORAGE_KEYS.USER_LEAGUES,JSON.stringify(e)),!0}catch(t){return console.error("Failed to save user league data:",t),!1}}addUserToLeague(e,t=!1){const a=this.getUserLeagueData();a.leagues.includes(e)||a.leagues.push(e),t&&!a.createdLeagues.includes(e)&&a.createdLeagues.push(e),this.saveUserLeagueData(a)}removeUserFromLeague(e){const t=this.getUserLeagueData();t.leagues=t.leagues.filter(a=>a!==e),t.createdLeagues=t.createdLeagues.filter(a=>a!==e),t.activeLeagueId===e&&(t.activeLeagueId=null),this.saveUserLeagueData(t)}getActiveLeagueId(){return this.getUserLeagueData().activeLeagueId}setActiveLeagueId(e){const t=this.getUserLeagueData();t.activeLeagueId=e,this.saveUserLeagueData(t)}getActiveLeague(){const e=this.getActiveLeagueId();return e?this.getLeague(e):null}saveUserPicksWithLeague(e,t,a=null){return a?this.saveLeaguePick(a,e,t):y(e,t)}saveLeaguePick(e,t,a){const r=this.getLeague(e);if(!r)throw new Error("League not found");const s=this.getCurrentUserId(),n=JSON.parse(localStorage.getItem("nextRaceData"));if(!n||!n.raceId)throw new Error("No valid race data found. Cannot save pick.");const i={driverId:parseInt(t),timestamp:new Date().toISOString(),raceId:n.raceId,driverName:(a==null?void 0:a.driverName)||null,teamName:(a==null?void 0:a.teamName)||null,isAutoPick:(a==null?void 0:a.isAutoPick)||!1};r.picks||(r.picks={}),r.picks[s]||(r.picks[s]=[]);const c=r.picks[s].findIndex(l=>l.raceId===n.raceId);return c!==-1?r.picks[s][c]=i:r.picks[s].push(i),this.saveLeague(r),i}loadUserPicksWithLeague(e=null){return e?this.loadLeaguePicks(e):L()}loadLeaguePicks(e,t=null){const a=this.getLeague(e);if(!a)return[];const r=t||this.getCurrentUserId();return a.picks&&a.picks[r]?a.picks[r]:[]}isDriverAlreadyPickedInLeague(e,t){return this.loadLeaguePicks(t).some(r=>r.driverId===parseInt(e))}getCurrentRacePickForLeague(e){try{const t=JSON.parse(localStorage.getItem("nextRaceData"));return t&&this.loadLeaguePicks(e).find(r=>r.raceId===t.raceId)||null}catch(t){return console.error("Failed to get current race pick for league:",t),null}}getUserLeagues(){const e=this.getUserLeagueData(),t=this.getAllLeagues();return e.leagues.map(a=>t[a]).filter(a=>a!==null).map(a=>({...a,isOwner:a.ownerId===this.currentUserId}))}findLeagueByInviteCode(e){const t=this.getAllLeagues();return Object.values(t).find(a=>a.inviteCode===e.toUpperCase())||null}}const E=new _;class G{constructor(){this.storageManager=E,this.currentUserId=this.storageManager.getCurrentUserId(),this.activeLeagueId=this.storageManager.getActiveLeagueId()}async createLeague(e,t={}){if(!e||e.trim().length===0)throw new Error("League name cannot be empty");if(e.trim().length>50)throw new Error("League name cannot exceed 50 characters");const a=this.generateLeagueId(),r=this.generateInviteCode(),s={leagueId:a,leagueName:e.trim(),ownerId:this.currentUserId,inviteCode:r,season:h(),createdAt:new Date().toISOString(),members:[{userId:this.currentUserId,username:this.storageManager.getCurrentUsername(),joinedAt:new Date().toISOString(),status:"ACTIVE",isOwner:!0}],picks:{},settings:{maxMembers:20,isPrivate:!0,autoPickEnabled:!0,...t}};if(!this.storageManager.saveLeague(s))throw new Error("Failed to save league");return this.storageManager.addUserToLeague(a,!0),s}async joinLeague(e){if(!e||e.trim().length===0)throw new Error("Invalid invite code");const t=this.storageManager.findLeagueByInviteCode(e.trim());if(!t)throw new Error("Invalid invite code");if(t.season!==h())throw new Error("This league is from a different season");if(t.members.some(r=>r.userId===this.currentUserId))throw new Error("Already a member of this league");if(t.members.length>=t.settings.maxMembers)throw new Error("League is full");const a={userId:this.currentUserId,username:this.storageManager.getCurrentUsername(),joinedAt:new Date().toISOString(),status:"ACTIVE",isOwner:!1};if(t.members.push(a),t.picks||(t.picks={}),t.picks[this.currentUserId]=[],!this.storageManager.saveLeague(t))throw new Error("Failed to join league");return this.storageManager.addUserToLeague(t.leagueId,!1),t}async leaveLeague(e){const t=this.storageManager.getLeague(e);if(!t)throw new Error("League not found");const a=t.members.findIndex(r=>r.userId===this.currentUserId);if(a===-1)throw new Error("Not a member of this league");if(t.ownerId===this.currentUserId)throw new Error("League owner cannot leave. Delete the league instead.");if(t.members.splice(a,1),t.picks&&t.picks[this.currentUserId]&&delete t.picks[this.currentUserId],!this.storageManager.saveLeague(t))throw new Error("Failed to leave league");return this.storageManager.removeUserFromLeague(e),!0}async deleteLeague(e){const t=this.storageManager.getLeague(e);if(!t)throw new Error("League not found");if(t.ownerId!==this.currentUserId)throw new Error("Only the league owner can delete the league");t.members.forEach(r=>{r.userId,this.currentUserId});const a=this.storageManager.getAllLeagues();return delete a[e],localStorage.setItem("f1survivor_league_data",JSON.stringify(a)),this.storageManager.removeUserFromLeague(e),!0}async kickMember(e,t){const a=this.storageManager.getLeague(e);if(!a)throw new Error("League not found");if(a.ownerId!==this.currentUserId)throw new Error("Only the league owner can kick members");if(t===this.currentUserId)throw new Error("Cannot kick yourself from the league");const r=a.members.findIndex(s=>s.userId===t);if(r===-1)throw new Error("Member not found in league");if(a.members.splice(r,1),a.picks&&a.picks[t]&&delete a.picks[t],!this.storageManager.saveLeague(a))throw new Error("Failed to kick member");return!0}async updateLeagueSettings(e,t){const a=this.storageManager.getLeague(e);if(!a)throw new Error("League not found");if(a.ownerId!==this.currentUserId)throw new Error("Only the league owner can update settings");if(t.maxMembers&&t.maxMembers<a.members.length)throw new Error("Cannot set max members below current member count");if(a.settings={...a.settings,...t},!this.storageManager.saveLeague(a))throw new Error("Failed to update league settings");return a}getLeagueStandings(e){const t=this.storageManager.getLeague(e);if(!t)throw new Error("League not found");const a=t.members.map(r=>{const s=t.picks[r.userId]||[],n=s.length;return{userId:r.userId,username:r.username,survivedRaces:n,totalPicks:s.length,lastPick:s[s.length-1]||null,isEliminated:!1,isOwner:r.isOwner}});return a.sort((r,s)=>s.survivedRaces-r.survivedRaces),a}generateLeagueId(){return`league_${Date.now()}_${Math.random().toString(36).substr(2,9)}`}generateInviteCode(){const e="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";let t="";for(let a=0;a<8;a++)t+=e.charAt(Math.floor(Math.random()*e.length));return t}getActiveLeague(){return this.storageManager.getActiveLeague()}setActiveLeague(e){this.storageManager.setActiveLeagueId(e),this.activeLeagueId=e}getUserLeagues(){return this.storageManager.getUserLeagues()}isLeagueOwner(e){const t=this.storageManager.getLeague(e);return t&&t.ownerId===this.currentUserId}getLeague(e){return this.storageManager.getLeague(e)}previewLeague(e){const t=this.storageManager.findLeagueByInviteCode(e.trim());return t?{leagueName:t.leagueName,memberCount:t.members.length,maxMembers:t.settings.maxMembers,season:t.season,createdAt:t.createdAt}:null}}const w=new G;class O{constructor(){this.leagueManager=w,this.activeModal=null}showCreateLeagueModal(){this.closeActiveModal(),document.body.insertAdjacentHTML("beforeend",`
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>Create New League</h3>
          
          <form id="create-league-form">
            <div class="form-group">
              <label for="league-name">League Name</label>
              <input type="text" id="league-name" maxlength="50" required>
              <small>Choose a memorable name for your league</small>
            </div>
            
            <div class="form-group">
              <label for="max-members">Max Members</label>
              <select id="max-members">
                <option value="10">10 Players</option>
                <option value="15">15 Players</option>
                <option value="20" selected>20 Players</option>
                <option value="30">30 Players</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="auto-pick-enabled" checked>
                Enable auto-pick for missed deadlines
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" id="cancel-create">Cancel</button>
              <button type="submit" id="create-league-btn">Create League</button>
            </div>
          </form>
        </div>
      </div>
    `),this.activeModal=document.getElementById("league-modal"),this.attachCreateLeagueEvents()}showJoinLeagueModal(){this.closeActiveModal(),document.body.insertAdjacentHTML("beforeend",`
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>Join League</h3>
          
          <form id="join-league-form">
            <div class="form-group">
              <label for="invite-code">Invite Code</label>
              <input type="text" id="invite-code" placeholder="Enter 8-character code" maxlength="8" required>
              <small>Ask your league organizer for the invite code</small>
            </div>
            
            <div id="league-preview" class="league-preview" style="display: none;">
              <h4>League Preview</h4>
              <div class="preview-info">
                <p><strong>Name:</strong> <span id="preview-name"></span></p>
                <p><strong>Members:</strong> <span id="preview-members"></span></p>
                <p><strong>Season:</strong> <span id="preview-season"></span></p>
              </div>
            </div>
            
            <div id="join-error" class="error-message" style="display: none;"></div>
            
            <div class="form-actions">
              <button type="button" id="cancel-join">Cancel</button>
              <button type="submit" id="join-league-btn">Join League</button>
            </div>
          </form>
        </div>
      </div>
    `),this.activeModal=document.getElementById("league-modal"),this.attachJoinLeagueEvents()}showManageLeaguesModal(){this.closeActiveModal();const e=this.leagueManager.getUserLeagues(),t=`
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content large">
          <button class="close-btn">&times;</button>
          <h3>Manage Leagues</h3>
          
          <div class="league-actions">
            <button id="create-league-action" class="action-btn create">
              <span class="icon">+</span>
              Create New League
            </button>
            <button id="join-league-action" class="action-btn join">
              <span class="icon">🔗</span>
              Join League
            </button>
          </div>
          
          <div class="user-leagues">
            <h4>Your Leagues</h4>
            <div class="leagues-list">
              ${e.length===0?`<p class="no-leagues">You haven't joined any leagues yet.</p>`:e.map(a=>`
                  <div class="league-item" data-league-id="${a.leagueId}">
                    <div class="league-info">
                      <h5>${this.escapeHtml(a.leagueName)}</h5>
                      <p>${a.members.length} members • ${a.isOwner?"Owner":"Member"}</p>
                      ${a.isOwner?`<p class="invite-code">Invite Code: <strong>${a.inviteCode}</strong></p>`:""}
                    </div>
                    <div class="league-actions-item">
                      <button class="select-league" data-league-id="${a.leagueId}">Select</button>
                      ${a.isOwner?`<button class="manage-league" data-league-id="${a.leagueId}">Settings</button>`:""}
                      <button class="leave-league" data-league-id="${a.leagueId}">${a.isOwner?"Delete":"Leave"}</button>
                    </div>
                  </div>
                `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;document.body.insertAdjacentHTML("beforeend",t),this.activeModal=document.getElementById("league-modal"),this.attachManageLeaguesEvents()}showLeagueSettingsModal(e){this.closeActiveModal();const t=this.leagueManager.getLeague(e);if(!t||t.ownerId!==this.leagueManager.currentUserId)return;const a=`
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content">
          <button class="close-btn">&times;</button>
          <h3>League Settings: ${this.escapeHtml(t.leagueName)}</h3>
          
          <div class="league-info-section">
            <p><strong>Invite Code:</strong> <span class="invite-code-display">${t.inviteCode}</span></p>
            <button class="copy-invite-code" data-code="${t.inviteCode}">Copy Code</button>
          </div>
          
          <form id="league-settings-form">
            <div class="form-group">
              <label for="max-members-setting">Max Members</label>
              <select id="max-members-setting">
                <option value="10" ${t.settings.maxMembers===10?"selected":""}>10 Players</option>
                <option value="15" ${t.settings.maxMembers===15?"selected":""}>15 Players</option>
                <option value="20" ${t.settings.maxMembers===20?"selected":""}>20 Players</option>
                <option value="30" ${t.settings.maxMembers===30?"selected":""}>30 Players</option>
              </select>
              <small>Current members: ${t.members.length}</small>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="auto-pick-enabled-setting" ${t.settings.autoPickEnabled?"checked":""}>
                Enable auto-pick for missed deadlines
              </label>
            </div>
            
            <div class="form-actions">
              <button type="button" id="cancel-settings">Cancel</button>
              <button type="submit" id="save-settings-btn">Save Settings</button>
            </div>
          </form>
          
          <div class="members-section">
            <h4>Members</h4>
            <div class="members-list">
              ${t.members.map(r=>`
                <div class="member-item">
                  <span class="member-name">${this.escapeHtml(r.username)} ${r.isOwner?"(Owner)":""}</span>
                  ${!r.isOwner&&r.userId!==this.leagueManager.currentUserId?`<button class="kick-member" data-user-id="${r.userId}">Remove</button>`:""}
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      </div>
    `;document.body.insertAdjacentHTML("beforeend",a),this.activeModal=document.getElementById("league-modal"),this.attachLeagueSettingsEvents(e)}attachCreateLeagueEvents(){const e=this.activeModal,t=e.querySelector("#create-league-form"),a=e.querySelector(".close-btn"),r=e.querySelector("#cancel-create");a.addEventListener("click",()=>this.closeActiveModal()),r.addEventListener("click",()=>this.closeActiveModal()),t.addEventListener("submit",async s=>{s.preventDefault();const n=document.getElementById("league-name").value,i=parseInt(document.getElementById("max-members").value),c=document.getElementById("auto-pick-enabled").checked;try{const l=await this.leagueManager.createLeague(n,{maxMembers:i,autoPickEnabled:c});this.showSuccessModal("League Created!",`Your league "${l.leagueName}" has been created successfully.<br>
          <strong>Invite Code: ${l.inviteCode}</strong><br>
          Share this code with friends to invite them to your league.`),this.leagueManager.setActiveLeague(l.leagueId),setTimeout(()=>{window.location.reload()},3e3)}catch(l){this.showError(l.message)}})}attachJoinLeagueEvents(){const e=this.activeModal,t=e.querySelector("#join-league-form"),a=e.querySelector(".close-btn"),r=e.querySelector("#cancel-join"),s=e.querySelector("#invite-code"),n=e.querySelector("#league-preview"),i=e.querySelector("#join-error");a.addEventListener("click",()=>this.closeActiveModal()),r.addEventListener("click",()=>this.closeActiveModal());let c;s.addEventListener("input",l=>{clearTimeout(c);const d=l.target.value.trim();d.length===8?c=setTimeout(()=>{const u=this.leagueManager.previewLeague(d);u?(e.querySelector("#preview-name").textContent=u.leagueName,e.querySelector("#preview-members").textContent=`${u.memberCount}/${u.maxMembers}`,e.querySelector("#preview-season").textContent=u.season,n.style.display="block",i.style.display="none"):n.style.display="none"},300):n.style.display="none"}),t.addEventListener("submit",async l=>{l.preventDefault();const d=s.value.trim();try{const u=await this.leagueManager.joinLeague(d);this.showSuccessModal("Joined League!",`You have successfully joined "${u.leagueName}".`),this.leagueManager.setActiveLeague(u.leagueId),setTimeout(()=>{window.location.reload()},2e3)}catch(u){i.textContent=u.message,i.style.display="block"}})}attachManageLeaguesEvents(){const e=this.activeModal,t=e.querySelector(".close-btn"),a=e.querySelector("#create-league-action"),r=e.querySelector("#join-league-action");t.addEventListener("click",()=>this.closeActiveModal()),a.addEventListener("click",()=>this.showCreateLeagueModal()),r.addEventListener("click",()=>this.showJoinLeagueModal()),e.querySelectorAll(".select-league").forEach(s=>{s.addEventListener("click",n=>{const i=n.target.dataset.leagueId;this.leagueManager.setActiveLeague(i),window.location.reload()})}),e.querySelectorAll(".manage-league").forEach(s=>{s.addEventListener("click",n=>{const i=n.target.dataset.leagueId;this.showLeagueSettingsModal(i)})}),e.querySelectorAll(".leave-league").forEach(s=>{s.addEventListener("click",async n=>{const i=n.target.dataset.leagueId,c=this.leagueManager.getLeague(i),l=this.leagueManager.isLeagueOwner(i),d=l?`Are you sure you want to delete "${c.leagueName}"? This action cannot be undone.`:`Are you sure you want to leave "${c.leagueName}"?`;if(confirm(d))try{l?await this.leagueManager.deleteLeague(i):await this.leagueManager.leaveLeague(i),window.location.reload()}catch(u){this.showError(u.message)}})})}attachLeagueSettingsEvents(e){const t=this.activeModal,a=t.querySelector("#league-settings-form"),r=t.querySelector(".close-btn"),s=t.querySelector("#cancel-settings"),n=t.querySelector(".copy-invite-code");r.addEventListener("click",()=>this.closeActiveModal()),s.addEventListener("click",()=>this.closeActiveModal()),n.addEventListener("click",i=>{const c=i.target.dataset.code;navigator.clipboard.writeText(c).then(()=>{i.target.textContent="Copied!",setTimeout(()=>{i.target.textContent="Copy Code"},2e3)})}),a.addEventListener("submit",async i=>{i.preventDefault();const c=parseInt(document.getElementById("max-members-setting").value),l=document.getElementById("auto-pick-enabled-setting").checked;try{await this.leagueManager.updateLeagueSettings(e,{maxMembers:c,autoPickEnabled:l}),this.showSuccessModal("Settings Updated","League settings have been updated successfully."),setTimeout(()=>{this.showManageLeaguesModal()},1500)}catch(d){this.showError(d.message)}}),t.querySelectorAll(".kick-member").forEach(i=>{i.addEventListener("click",async c=>{const l=c.target.dataset.userId,u=this.leagueManager.getLeague(e).members.find(g=>g.userId===l);if(confirm(`Are you sure you want to remove ${u.username} from the league?`))try{await this.leagueManager.kickMember(e,l),this.showLeagueSettingsModal(e)}catch(g){this.showError(g.message)}})})}showSuccessModal(e,t){this.closeActiveModal();const a=`
      <div id="league-modal" class="league-modal">
        <div class="league-modal-content small success">
          <h3>${e}</h3>
          <p>${t}</p>
        </div>
      </div>
    `;document.body.insertAdjacentHTML("beforeend",a),this.activeModal=document.getElementById("league-modal"),setTimeout(()=>{this.closeActiveModal()},3e3)}showError(e){const t=document.createElement("div");t.className="error-toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>{t.remove()},3e3)}closeActiveModal(){this.activeModal&&(this.activeModal.remove(),this.activeModal=null)}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}}const $=new O;class R{constructor(){this.leagueManager=w,this.modalManager=$,this.storageManager=E,this.currentLeague=null}async initialize(){this.currentLeague=this.leagueManager.getActiveLeague(),this.renderLeagueSelector(),this.currentLeague&&this.updateDashboardForLeague()}renderLeagueSelector(){const e=document.querySelector(".dashboard-container");if(!e)return;const t=document.querySelector(".league-selector-wrapper");t&&t.remove();const a=this.leagueManager.getUserLeagues(),r=this.storageManager.getActiveLeagueId(),s=`
      <div class="league-selector-wrapper">
        <div class="league-selector">
          <label>Current Mode:</label>
          <select id="league-selector">
            <option value="" ${r?"":"selected"}>Solo Play</option>
            ${a.map(n=>`
              <option value="${n.leagueId}" ${n.leagueId===r?"selected":""}>
                ${this.escapeHtml(n.leagueName)}
              </option>
            `).join("")}
          </select>
          <button id="manage-leagues-btn" class="manage-leagues-btn">
            <span class="icon">⚙️</span>
            Manage Leagues
          </button>
        </div>
      </div>
    `;e.insertAdjacentHTML("afterbegin",s),this.attachSelectorEvents()}attachSelectorEvents(){const e=document.getElementById("league-selector"),t=document.getElementById("manage-leagues-btn");e&&e.addEventListener("change",a=>{const r=a.target.value;r?this.leagueManager.setActiveLeague(r):this.leagueManager.setActiveLeague(null),window.location.reload()}),t&&t.addEventListener("click",()=>{this.modalManager.showManageLeaguesModal()})}updateDashboardForLeague(){const e=document.querySelector(".dashboard-container h1");e&&this.currentLeague&&(e.innerHTML=`Dashboard - <span class="league-name">${this.escapeHtml(this.currentLeague.leagueName)}</span>`),this.updateEliminationZoneForLeague(),this.updateStatsForLeague()}updateEliminationZoneForLeague(){if(!this.currentLeague)return;const e=this.leagueManager.getLeagueStandings(this.currentLeague.leagueId),t=document.querySelector(".elimination-zone");if(t){const a=t.querySelector(".players-container");a&&(a.innerHTML=e.map((s,n)=>`
          <div class="player-card ${s.userId===this.leagueManager.currentUserId?"current-user":""} ${s.isEliminated?"eliminated":""}">
            <div class="player-rank">${n+1}</div>
            <div class="player-info">
              <h3>${this.escapeHtml(s.username)} ${s.isOwner?'<span class="owner-badge">Owner</span>':""}</h3>
              <p>${s.survivedRaces} races survived</p>
              ${s.lastPick?`<p class="last-pick">Last pick: ${s.lastPick.driverName}</p>`:""}
            </div>
            ${s.isEliminated?'<div class="status eliminated">ELIMINATED</div>':'<div class="status active">ACTIVE</div>'}
          </div>
        `).join(""));const r=t.querySelector("h2");r&&(r.textContent=`League Standings - ${this.currentLeague.leagueName}`)}}updateStatsForLeague(){if(!this.currentLeague)return;const e=this.storageManager.loadLeaguePicks(this.currentLeague.leagueId),t=document.querySelector('[data-stat="races-survived"]');t&&(t.textContent=e.length);const a=this.leagueManager.getLeagueStandings(this.currentLeague.leagueId),r=a.findIndex(n=>n.userId===this.leagueManager.currentUserId)+1,s=document.querySelector('[data-stat="league-position"]');if(s)s.textContent=`${r}/${a.length}`;else{const n=document.querySelector(".stats-grid");if(n){const i=document.createElement("div");i.className="stat-card",i.innerHTML=`
          <h3>League Position</h3>
          <p class="stat-value" data-stat="league-position">${r}/${a.length}</p>
        `,n.appendChild(i)}}}getPickContext(){const e=this.storageManager.getActiveLeagueId();return{isLeagueMode:!!e,leagueId:e,league:e?this.leagueManager.getLeague(e):null}}async savePickWithContext(e,t){const a=this.getPickContext();if(a.isLeagueMode)return await this.storageManager.saveLeaguePick(a.leagueId,e,t);{const{saveUserPicks:r}=await P(async()=>{const{saveUserPicks:s}=await Promise.resolve().then(()=>x);return{saveUserPicks:s}},void 0,import.meta.url);return r(e,t)}}loadPicksWithContext(){const e=this.getPickContext();if(e.isLeagueMode)return this.storageManager.loadLeaguePicks(e.leagueId);{const{loadUserPicks:t}=window;return t()}}isDriverAlreadyPickedInContext(e){const t=this.getPickContext();if(t.isLeagueMode)return this.storageManager.isDriverAlreadyPickedInLeague(e,t.leagueId);{const{isDriverAlreadyPicked:a}=window;return a(e)}}escapeHtml(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}}const M=new R;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{M.initialize()}):M.initialize();export{b as F,P as _,U as a,L as b,C as c,N as d,k as g,T as i,E as l,q as r,y as s};
