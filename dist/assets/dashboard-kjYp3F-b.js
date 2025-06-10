import{c as f,d}from"./league-dashboard-Ni62b5cB.js";import{addTestDashboardData as I,getDashboardData as y,getRaceName as k}from"./dashboard-utils-BLCRnluD.js";import"./race-results-api-BOSDOCeH.js";function E(t,e){return t.map(s=>({username:s.username,driverName:s.pick.driverName,position:s.pick.finalPosition==="DNF"?"DNF":`P${s.pick.finalPosition}`,team:s.pick.team,isYou:s.userId===e,pickRisk:s.pick.finalPosition>15?"HIGH":s.pick.finalPosition>10?"MEDIUM":"LOW"}))}function P(t,e){return t.map(i=>({...i,isCurrentUser:i.userId===e,survivalRate:i.totalPicks>0?i.safePicks/i.totalPicks:0,avgPosition:i.avgFinishPosition||8.5,riskLevel:L(i)})).sort((i,n)=>i.status!==n.status?i.status==="ACTIVE"?-1:1:Math.abs(i.survivalRate-n.survivalRate)>.1?n.survivalRate-i.survivalRate:i.avgPosition-n.avgPosition).map((i,n)=>({...i,rank:n+1}))}function L(t){const{remainingDrivers:e,currentRank:s,activePlayers:i}=t;if(!e)return"UNKNOWN";const n=e.filter(r=>r.avgPosition<=5).length,a=s/i*100;return a<=33&&n>=3?"LOW":a<=66&&n>=2?"MEDIUM":a<=80?"HIGH":"CRITICAL"}function w(t="user123"){return{leagueData:{leagueId:"league-demo",leagueName:"Speed Demons",season:"2025",totalPlayers:18,activePlayers:15,eliminatedPlayers:3,lastProcessedRace:{raceId:"sau-2025",raceName:"Saudi Arabian GP",processedAt:new Date(Date.now()-2*60*60*1e3).toISOString(),status:"FINAL"}},userStatus:{userId:t,username:"YOU",leagueId:"league-demo",status:"ACTIVE",currentRank:11,percentile:73,totalPicks:2,safePicks:1,riskyPicks:1,eliminationRace:null,remainingDrivers:[{driverId:14,name:"Alonso",avgPosition:8.5},{driverId:63,name:"Russell",avgPosition:5.2},{driverId:44,name:"Hamilton",avgPosition:4.8},{driverId:16,name:"Leclerc",avgPosition:6.1},{driverId:55,name:"Sainz",avgPosition:7.3},{driverId:81,name:"Piastri",avgPosition:8.9},{driverId:18,name:"Stroll",avgPosition:11.2},{driverId:27,name:"Hulkenberg",avgPosition:12.1},{driverId:20,name:"Magnussen",avgPosition:13.4},{driverId:2,name:"Sargeant",avgPosition:16.8},{driverId:77,name:"Bottas",avgPosition:14.2},{driverId:24,name:"Zhou",avgPosition:15.1}],survivalProbability:.72},eliminations:[{userId:"user456",username:"TurboTom",pick:{driverId:20,driverName:"Kevin Magnussen",finalPosition:14,team:"Haas"}},{userId:"user789",username:"RacerSarah",pick:{driverId:2,driverName:"Logan Sargeant",finalPosition:16,team:"Williams"}},{userId:"user101",username:"GridMaster",pick:{driverId:24,driverName:"Zhou Guanyu",finalPosition:"DNF",team:"Kick Sauber"}}],standings:[{userId:"user999",username:"AlphaDriver",rank:1,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user888",username:"F1Prophet",rank:2,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user777",username:"GridWarrior",rank:3,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user666",username:"SpeedKing",rank:4,safePicks:1,totalPicks:2,status:"ACTIVE"},{userId:"user555",username:"RaceAce",rank:5,safePicks:1,totalPicks:2,status:"ACTIVE"},{userId:t,username:"YOU",rank:11,safePicks:1,totalPicks:2,status:"ACTIVE"}]}}class D{constructor(e){this.container=e,this.isExpanded=!1,this.leagueData=null,this.userStatus=null,this.eliminations=null,this.standings=null,this.updateInterval=null,this.userId="user123"}async initialize(e="league-demo",s="user123"){this.leagueId=e,this.userId=s;try{console.log("Initializing Elimination Zone..."),this.showLoading(),await this.loadMockData(),this.render(),this.setupAutoRefresh(),console.log("Elimination Zone initialized successfully")}catch(i){console.error("Failed to initialize Elimination Zone:",i),this.showError("Failed to load league data. Please try again.")}}async loadMockData(){await new Promise(s=>setTimeout(s,500));const e=w(this.userId);this.leagueData=e.leagueData,this.userStatus=e.userStatus,this.eliminations=e.eliminations,this.standings=e.standings,console.log("Mock league data loaded:",e)}render(){if(!this.leagueData||!this.userStatus){this.showError("No league data available");return}this.container.innerHTML=`
      <div class="elimination-zone">
        ${this.renderHeader()}
        ${this.renderSimpleView()}
        ${this.isExpanded?this.renderExpandedView():""}
        ${this.renderToggleButton()}
      </div>
    `,this.attachEventListeners()}renderHeader(){return`
      <div class="ez-header">
        <h3 class="ez-title">ELIMINATION ZONE</h3>
        <div class="ez-league-name">League: "${this.leagueData.leagueName}"</div>
      </div>
    `}renderSimpleView(){const{lastProcessedRace:e}=this.leagueData,{eliminatedPlayers:s,activePlayers:i}=this.leagueData;return`
      <div class="ez-simple-view">
        <div class="ez-last-race">
          Last Race • ${e.raceName}
        </div>
        
        <div class="ez-elimination-count">
          ❌ <span class="eliminated">${s} ELIMINATED</span> / 
          <span class="remaining">${i} REMAINING</span>
        </div>
      </div>
    `}renderExpandedView(){return`
      <div class="ez-expanded-view">
        ${this.renderEliminationDetails()}
        ${this.renderStandings()}
      </div>
    `}renderEliminationDetails(){if(!this.eliminations||this.eliminations.length===0)return`
        <div class="ez-eliminations">
          <h4>❌ ELIMINATED (0 players)</h4>
          <p>No eliminations yet this season.</p>
        </div>
      `;const e=E(this.eliminations,this.userId);return`
      <div class="ez-eliminations">
        <h4>❌ ELIMINATED (${this.eliminations.length} players)</h4>
        ${e.map(s=>`
          <div class="ez-elimination-item">
            <div class="ez-elimination-player-pick">
              <span class="ez-elimination-player">${s.username}</span>
              <span class="ez-elimination-pick">Picked: ${s.driverName}</span>
            </div>
            <div class="ez-elimination-position">${s.position}</div>
          </div>
        `).join("")}
      </div>
    `}renderStandings(){const e=P(this.standings,this.userId),s=e.slice(0,5),i=e.find(n=>n.userId===this.userId);return`
      <div class="ez-standings">
        <h4>Remaining Players</h4>
        <div class="ez-standings-list">
          ${s.map(n=>`
            <div class="ez-standing-item ${n.isCurrentUser?"current-user":""}">
              <div class="ez-standing-rank">${n.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${n.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(n.username)}</span>
              </div>
              <div class="ez-standing-stats">${n.status}</div>
            </div>
          `).join("")}
          
          ${i&&i.rank>5?`
            <div class="ez-standing-item current-user">
              <div class="ez-standing-rank">${i.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${i.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(i.username)}</span>
              </div>
              <div class="ez-standing-stats">${i.status}</div>
            </div>
          `:""}
        </div>
      </div>
    `}renderToggleButton(){return`
      <button class="ez-toggle-btn ${this.isExpanded?"expanded":""}">
        ${this.isExpanded?"▲ Hide Details":"▼ Show Elimination Details"}
      </button>
    `}attachEventListeners(){const e=this.container.querySelector(".ez-toggle-btn");e&&e.addEventListener("click",()=>{this.isExpanded=!this.isExpanded,this.render()})}showLoading(){this.container.innerHTML=`
      <div class="elimination-zone">
        <div class="ez-loading">
          <div class="ez-loading-spinner"></div>
          Loading league data...
        </div>
      </div>
    `}showError(e){this.container.innerHTML=`
      <div class="elimination-zone">
        <div class="ez-error">
          <h4>Error</h4>
          <p>${e}</p>
        </div>
      </div>
    `}setupAutoRefresh(){this.updateInterval=setInterval(()=>{this.shouldAutoRefresh()&&(console.log("Auto-refreshing elimination zone..."),this.refresh())},3e4)}shouldAutoRefresh(){const e=new Date,s=new Date(this.leagueData.lastProcessedRace.processedAt);return e.getTime()-s.getTime()<2*60*60*1e3}async refresh(){try{await this.loadMockData(),this.render()}catch(e){console.error("Failed to refresh elimination zone:",e)}}getOrdinalSuffix(e){const s=e%10,i=e%100;return s===1&&i!==11?"st":s===2&&i!==12?"nd":s===3&&i!==13?"rd":"th"}getLastPickForPlayer(e){return{AlphaDriver:"Verstappen",F1Prophet:"Leclerc",GridWarrior:"Hamilton",SpeedKing:"Norris",RaceAce:"Russell",YOU:"Norris"}[e]||"Unknown"}destroy(){this.updateInterval&&clearInterval(this.updateInterval)}}let l=null;async function S(){try{console.log("Initializing authentication state management"),d.onAuthStateChange(e=>{c(e)});const t=await d.isAuthenticated();c(t),console.log("Authentication state management initialized")}catch(t){console.error("Failed to initialize authentication state:",t)}}async function c(t){var i;console.log("Updating UI for auth state:",t);const e=document.querySelectorAll(".sign-in"),s=document.querySelectorAll(".nav-link");if(t)try{const n=await d.getCurrentUser(),a=((i=n==null?void 0:n.signInDetails)==null?void 0:i.loginId)||(n==null?void 0:n.username)||"User";e.forEach(r=>{r.textContent=a.split("@")[0],r.onclick=o=>{o.preventDefault(),o.stopPropagation(),g()},r.classList.add("authenticated")}),s.forEach(r=>{r.style.display="block"}),console.log("UI updated for authenticated user:",a)}catch(n){console.error("Error getting user info:",n),e.forEach(a=>{a.textContent="User",a.onclick=r=>{r.preventDefault(),r.stopPropagation(),g()},a.classList.add("authenticated")}),s.forEach(a=>{a.style.display="block"})}else e.forEach(n=>{n.textContent="Sign In",n.onclick=()=>showAuthModal("signin"),n.classList.remove("authenticated")}),s.forEach(n=>{n.style.display="none"}),console.log("UI updated for unauthenticated user")}function g(){document.querySelectorAll(".user-menu").forEach(i=>i.remove());const e=document.createElement("div");e.className="user-menu",e.innerHTML=`
    <div class="user-menu-content">
      <button onclick="handleSignOut()" style="
        background: #ffffff;
        border: 2px solid #dc2626;
        color: #dc2626;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        transition: all 0.2s ease;
      " 
      onmouseover="this.style.background='#dc2626'; this.style.color='#ffffff'" 
      onmouseout="this.style.background='#ffffff'; this.style.color='#dc2626'">
        Sign Out
      </button>
    </div>
  `;const s=document.querySelector(".sign-in");if(s){const i=s.getBoundingClientRect();e.style.position="fixed",e.style.top=`${i.bottom+5}px`,e.style.right="20px",e.style.zIndex="9999",e.style.background="#ffffff",e.style.border="2px solid #374151",e.style.borderRadius="6px",e.style.padding="0.5rem",e.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"}document.body.appendChild(e),setTimeout(()=>{document.addEventListener("click",function i(n){e.contains(n.target)||(e.remove(),document.removeEventListener("click",i))})},100)}async function z(){try{console.log("Signing out user");const t=await d.signOut();t.success?(console.log("Sign out successful"),document.querySelectorAll(".user-menu").forEach(s=>s.remove()),c(!1),window.location.href="index.html"):console.error("Sign out failed:",t.error)}catch(t){console.error("Sign out error:",t)}}async function v(){try{console.log("Initializing dashboard..."),M(),await S(),I(),l=await y(),console.log("Dashboard data loaded:",l);const t=document.getElementById("elimination-zone-container");t&&await new D(t).initialize("league-demo","user123"),b(l.stats),A(l.stats),N(l.userPicks),h(),console.log("Dashboard initialized successfully")}catch(t){console.error("Error initializing dashboard:",t),h(),T("Failed to load dashboard data. Please try refreshing the page.")}}function b(t){try{const e=document.getElementById("survival-status"),s=e.querySelector(".status-indicator"),i=e.querySelector(".status-text");s.classList.remove("alive","eliminated","pending"),t.playerStatus==="ALIVE"?(s.classList.add("alive"),i.textContent="ALIVE"):(s.classList.add("eliminated"),i.textContent="ELIMINATED"),console.log("Player status updated")}catch(e){console.error("Error updating player status:",e)}}function A(t){try{document.getElementById("races-completed").textContent=t.racesCompleted,document.getElementById("total-races").textContent=t.totalRaces,document.getElementById("remaining-drivers").textContent=t.remainingDrivers;const e=document.getElementById("next-race-name");e&&(e.textContent="Australian GP"),console.log("Season progress updated")}catch(e){console.error("Error updating season progress:",e)}}function N(t){try{const e=document.getElementById("pick-history-body"),s=document.getElementById("no-picks-message");if(!t||t.length===0){s.style.display="block";return}s.style.display="none",e.innerHTML="",[...t].sort((n,a)=>new Date(a.timestamp)-new Date(n.timestamp)).forEach(n=>{const a=C(n);e.appendChild(a)}),console.log("Pick history updated")}catch(e){console.error("Error updating pick history:",e)}}function C(t){var u,m;const e=document.createElement("div");e.className="pick-history-row";const s=document.createElement("div");s.className="pick-history-cell",s.innerHTML=`<span class="race-name">${k(t.raceId)}</span>`;const i=document.createElement("div");i.className="pick-history-cell",i.innerHTML=`
    <div class="driver-info">
      <span class="driver-name">${t.driverName||"Unknown Driver"}</span>
      <span class="team-name">${t.teamName||"Unknown Team"}</span>
      ${t.isAutoPick?'<span class="auto-pick-indicator">AUTO</span>':""}
    </div>
  `;const n=document.createElement("div");n.className="pick-history-cell";const a=((u=t.survivalStatus)==null?void 0:u.position)||"TBD";n.innerHTML=`<span class="position">${a}</span>`;const r=document.createElement("div");r.className="pick-history-cell";const o=((m=t.survivalStatus)==null?void 0:m.status)||"PENDING",p=o.toLowerCase();return r.innerHTML=`<span class="status-badge ${p}">${o}</span>`,e.appendChild(s),e.appendChild(i),e.appendChild(n),e.appendChild(r),e}function M(){const t=document.getElementById("dashboard-loading");t&&t.classList.add("active")}function h(){const t=document.getElementById("dashboard-loading");t&&t.classList.remove("active")}function T(t){const e=document.createElement("div");e.className="error-notification",e.innerHTML=`
    <div class="error-content">
      <h3>Error</h3>
      <p>${t}</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `,document.body.appendChild(e),setTimeout(()=>{e.parentElement&&e.remove()},5e3)}async function $(){console.log("Refreshing dashboard..."),await v()}window.showAuthModal=async(t="signin")=>{await f.showModal(t)};window.handleSignOut=z;document.addEventListener("DOMContentLoaded",v);window.addEventListener("storage",t=>{t.key==="f1survivor_user_picks"&&(console.log("User picks changed, refreshing dashboard..."),$())});
