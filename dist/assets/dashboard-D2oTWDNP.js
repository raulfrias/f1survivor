import"./league-dashboard-NO466IiK.js";import{addTestDashboardData as g,getDashboardData as h,getRaceName as p}from"./dashboard-utils-gQmmXdir.js";import"./race-results-api-BOSDOCeH.js";function k(s,e){return s.map(t=>({username:t.username,driverName:t.pick.driverName,position:t.pick.finalPosition==="DNF"?"DNF":`P${t.pick.finalPosition}`,team:t.pick.team,isYou:t.userId===e,pickRisk:t.pick.finalPosition>15?"HIGH":t.pick.finalPosition>10?"MEDIUM":"LOW"}))}function I(s,e){return s.map(i=>({...i,isCurrentUser:i.userId===e,survivalRate:i.totalPicks>0?i.safePicks/i.totalPicks:0,avgPosition:i.avgFinishPosition||8.5,riskLevel:P(i)})).sort((i,a)=>i.status!==a.status?i.status==="ACTIVE"?-1:1:Math.abs(i.survivalRate-a.survivalRate)>.1?a.survivalRate-i.survivalRate:i.avgPosition-a.avgPosition).map((i,a)=>({...i,rank:a+1}))}function P(s){const{remainingDrivers:e,currentRank:t,activePlayers:i}=s;if(!e)return"UNKNOWN";const a=e.filter(r=>r.avgPosition<=5).length,n=t/i*100;return n<=33&&a>=3?"LOW":n<=66&&a>=2?"MEDIUM":n<=80?"HIGH":"CRITICAL"}function E(s="user123"){return{leagueData:{leagueId:"league-demo",leagueName:"Speed Demons",season:"2025",totalPlayers:18,activePlayers:15,eliminatedPlayers:3,lastProcessedRace:{raceId:"sau-2025",raceName:"Saudi Arabian GP",processedAt:new Date(Date.now()-2*60*60*1e3).toISOString(),status:"FINAL"}},userStatus:{userId:s,username:"YOU",leagueId:"league-demo",status:"ACTIVE",currentRank:11,percentile:73,totalPicks:2,safePicks:1,riskyPicks:1,eliminationRace:null,remainingDrivers:[{driverId:14,name:"Alonso",avgPosition:8.5},{driverId:63,name:"Russell",avgPosition:5.2},{driverId:44,name:"Hamilton",avgPosition:4.8},{driverId:16,name:"Leclerc",avgPosition:6.1},{driverId:55,name:"Sainz",avgPosition:7.3},{driverId:81,name:"Piastri",avgPosition:8.9},{driverId:18,name:"Stroll",avgPosition:11.2},{driverId:27,name:"Hulkenberg",avgPosition:12.1},{driverId:20,name:"Magnussen",avgPosition:13.4},{driverId:2,name:"Sargeant",avgPosition:16.8},{driverId:77,name:"Bottas",avgPosition:14.2},{driverId:24,name:"Zhou",avgPosition:15.1}],survivalProbability:.72},eliminations:[{userId:"user456",username:"TurboTom",pick:{driverId:20,driverName:"Kevin Magnussen",finalPosition:14,team:"Haas"}},{userId:"user789",username:"RacerSarah",pick:{driverId:2,driverName:"Logan Sargeant",finalPosition:16,team:"Williams"}},{userId:"user101",username:"GridMaster",pick:{driverId:24,driverName:"Zhou Guanyu",finalPosition:"DNF",team:"Kick Sauber"}}],standings:[{userId:"user999",username:"AlphaDriver",rank:1,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user888",username:"F1Prophet",rank:2,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user777",username:"GridWarrior",rank:3,safePicks:2,totalPicks:2,status:"ACTIVE"},{userId:"user666",username:"SpeedKing",rank:4,safePicks:1,totalPicks:2,status:"ACTIVE"},{userId:"user555",username:"RaceAce",rank:5,safePicks:1,totalPicks:2,status:"ACTIVE"},{userId:s,username:"YOU",rank:11,safePicks:1,totalPicks:2,status:"ACTIVE"}]}}class f{constructor(e){this.container=e,this.isExpanded=!1,this.leagueData=null,this.userStatus=null,this.eliminations=null,this.standings=null,this.updateInterval=null,this.userId="user123"}async initialize(e="league-demo",t="user123"){this.leagueId=e,this.userId=t;try{console.log("Initializing Elimination Zone..."),this.showLoading(),await this.loadMockData(),this.render(),this.setupAutoRefresh(),console.log("Elimination Zone initialized successfully")}catch(i){console.error("Failed to initialize Elimination Zone:",i),this.showError("Failed to load league data. Please try again.")}}async loadMockData(){await new Promise(t=>setTimeout(t,500));const e=E(this.userId);this.leagueData=e.leagueData,this.userStatus=e.userStatus,this.eliminations=e.eliminations,this.standings=e.standings,console.log("Mock league data loaded:",e)}render(){if(!this.leagueData||!this.userStatus){this.showError("No league data available");return}this.container.innerHTML=`
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
    `}renderSimpleView(){const{lastProcessedRace:e}=this.leagueData,{eliminatedPlayers:t,activePlayers:i}=this.leagueData;return`
      <div class="ez-simple-view">
        <div class="ez-last-race">
          Last Race • ${e.raceName}
        </div>
        
        <div class="ez-elimination-count">
          ❌ <span class="eliminated">${t} ELIMINATED</span> / 
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
      `;const e=k(this.eliminations,this.userId);return`
      <div class="ez-eliminations">
        <h4>❌ ELIMINATED (${this.eliminations.length} players)</h4>
        ${e.map(t=>`
          <div class="ez-elimination-item">
            <div class="ez-elimination-player-pick">
              <span class="ez-elimination-player">${t.username}</span>
              <span class="ez-elimination-pick">Picked: ${t.driverName}</span>
            </div>
            <div class="ez-elimination-position">${t.position}</div>
          </div>
        `).join("")}
      </div>
    `}renderStandings(){const e=I(this.standings,this.userId),t=e.slice(0,5),i=e.find(a=>a.userId===this.userId);return`
      <div class="ez-standings">
        <h4>Remaining Players</h4>
        <div class="ez-standings-list">
          ${t.map(a=>`
            <div class="ez-standing-item ${a.isCurrentUser?"current-user":""}">
              <div class="ez-standing-rank">${a.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${a.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(a.username)}</span>
              </div>
              <div class="ez-standing-stats">${a.status}</div>
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
    `}setupAutoRefresh(){this.updateInterval=setInterval(()=>{this.shouldAutoRefresh()&&(console.log("Auto-refreshing elimination zone..."),this.refresh())},3e4)}shouldAutoRefresh(){const e=new Date,t=new Date(this.leagueData.lastProcessedRace.processedAt);return e.getTime()-t.getTime()<2*60*60*1e3}async refresh(){try{await this.loadMockData(),this.render()}catch(e){console.error("Failed to refresh elimination zone:",e)}}getOrdinalSuffix(e){const t=e%10,i=e%100;return t===1&&i!==11?"st":t===2&&i!==12?"nd":t===3&&i!==13?"rd":"th"}getLastPickForPlayer(e){return{AlphaDriver:"Verstappen",F1Prophet:"Leclerc",GridWarrior:"Hamilton",SpeedKing:"Norris",RaceAce:"Russell",YOU:"Norris"}[e]||"Unknown"}destroy(){this.updateInterval&&clearInterval(this.updateInterval)}}let o=null;async function m(){try{console.log("Initializing dashboard..."),N(),g(),o=await h(),console.log("Dashboard data loaded:",o);const s=document.getElementById("elimination-zone-container");s&&await new f(s).initialize("league-demo","user123"),y(o.stats),D(o.stats),L(o.userPicks),u(),console.log("Dashboard initialized successfully")}catch(s){console.error("Error initializing dashboard:",s),u(),w("Failed to load dashboard data. Please try refreshing the page.")}}function y(s){try{const e=document.getElementById("survival-status"),t=e.querySelector(".status-indicator"),i=e.querySelector(".status-text");t.classList.remove("alive","eliminated","pending"),s.playerStatus==="ALIVE"?(t.classList.add("alive"),i.textContent="ALIVE"):(t.classList.add("eliminated"),i.textContent="ELIMINATED"),console.log("Player status updated")}catch(e){console.error("Error updating player status:",e)}}function D(s){try{document.getElementById("races-completed").textContent=s.racesCompleted,document.getElementById("total-races").textContent=s.totalRaces,document.getElementById("remaining-drivers").textContent=s.remainingDrivers;const e=document.getElementById("next-race-name");e&&(e.textContent="Australian GP"),console.log("Season progress updated")}catch(e){console.error("Error updating season progress:",e)}}function L(s){try{const e=document.getElementById("pick-history-body"),t=document.getElementById("no-picks-message");if(!s||s.length===0){t.style.display="block";return}t.style.display="none",e.innerHTML="",[...s].sort((a,n)=>new Date(n.timestamp)-new Date(a.timestamp)).forEach(a=>{const n=z(a);e.appendChild(n)}),console.log("Pick history updated")}catch(e){console.error("Error updating pick history:",e)}}function z(s){var d,c;const e=document.createElement("div");e.className="pick-history-row";const t=document.createElement("div");t.className="pick-history-cell",t.innerHTML=`<span class="race-name">${p(s.raceId)}</span>`;const i=document.createElement("div");i.className="pick-history-cell",i.innerHTML=`
    <div class="driver-info">
      <span class="driver-name">${s.driverName||"Unknown Driver"}</span>
      <span class="team-name">${s.teamName||"Unknown Team"}</span>
      ${s.isAutoPick?'<span class="auto-pick-indicator">AUTO</span>':""}
    </div>
  `;const a=document.createElement("div");a.className="pick-history-cell";const n=((d=s.survivalStatus)==null?void 0:d.position)||"TBD";a.innerHTML=`<span class="position">${n}</span>`;const r=document.createElement("div");r.className="pick-history-cell";const l=((c=s.survivalStatus)==null?void 0:c.status)||"PENDING",v=l.toLowerCase();return r.innerHTML=`<span class="status-badge ${v}">${l}</span>`,e.appendChild(t),e.appendChild(i),e.appendChild(a),e.appendChild(r),e}function N(){const s=document.getElementById("dashboard-loading");s&&s.classList.add("active")}function u(){const s=document.getElementById("dashboard-loading");s&&s.classList.remove("active")}function w(s){const e=document.createElement("div");e.className="error-notification",e.innerHTML=`
    <div class="error-content">
      <h3>Error</h3>
      <p>${s}</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `,document.body.appendChild(e),setTimeout(()=>{e.parentElement&&e.remove()},5e3)}async function S(){console.log("Refreshing dashboard..."),await m()}document.addEventListener("DOMContentLoaded",m);window.addEventListener("storage",s=>{s.key==="f1survivor_user_picks"&&(console.log("User picks changed, refreshing dashboard..."),S())});
