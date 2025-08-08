import{b as l,j as g,k as c,c as L,f as E,h as k}from"./LeagueSelector-CtewzLvi.js";import{addTestDashboardData as S,getDashboardData as I}from"./DashboardUtils-BhayWyzZ.js";import"./RaceResultsApi-BOSDOCeH.js";function D(i,e){return i.map(t=>({username:t.username,driverName:t.pick.driverName,position:t.pick.finalPosition==="DNF"?"DNF":`P${t.pick.finalPosition}`,team:t.pick.team,isYou:t.userId===e,pickRisk:t.pick.finalPosition>15?"HIGH":t.pick.finalPosition>10?"MEDIUM":"LOW"}))}function C(i,e){return i.map(a=>({...a,isCurrentUser:a.userId===e,survivalRate:a.totalPicks>0?a.safePicks/a.totalPicks:0,avgPosition:a.avgFinishPosition||8.5,riskLevel:z(a)})).sort((a,s)=>a.status!==s.status?a.status==="ACTIVE"?-1:1:Math.abs(a.survivalRate-s.survivalRate)>.1?s.survivalRate-a.survivalRate:a.avgPosition-s.avgPosition).map((a,s)=>({...a,rank:s+1}))}function z(i){const{remainingDrivers:e,currentRank:t,activePlayers:a}=i;if(!e)return"UNKNOWN";const s=e.filter(o=>o.avgPosition<=5).length,n=t/a*100;return n<=33&&s>=3?"LOW":n<=66&&s>=2?"MEDIUM":n<=80?"HIGH":"CRITICAL"}class x{constructor(e){this.container=e,this.isExpanded=!1,this.leagueData=null,this.userStatus=null,this.eliminations=null,this.standings=null,this.updateInterval=null,this.userId="user123"}async initialize(e=null,t=null){try{console.log("Initializing Elimination Zone..."),this.showLoading();let a=null,s=0;const n=10;for(;!a&&s<n;)a=await l.getCurrentUser(),a||(console.log(`Authentication attempt ${s+1}/${n} - waiting for auth...`),await new Promise(o=>setTimeout(o,500)),s++);if(!a){console.log("Authentication timeout - user not authenticated"),this.showError("Authentication required to view league data");return}if(console.log("User authenticated:",a),this.userId=t||a.userId||a.username,e)this.leagueId=e;else{const o=await g.getActiveLeague();if(o)this.leagueId=o.leagueId;else{const r=await c.getUserLeagues();if(!r||r.length===0){this.showError("No leagues found. Please create or join a league to view elimination data.");return}else console.log("User has leagues but no active one, setting first league as active:",r[0]),await g.setActiveLeague(r[0].leagueId),this.leagueId=r[0].leagueId}}await this.loadRealData(),this.render(),this.setupAutoRefresh(),console.log("Elimination Zone initialized successfully")}catch(a){console.error("Failed to initialize Elimination Zone:",a),this.showError("Failed to load league data. Please try again.")}}async loadRealData(){try{const e=await c.getLeague(this.leagueId);if(!e)throw new Error("League not found");const t=await c.getLeagueMembers(this.leagueId),a=await g.getLeagueStandings(this.leagueId),s=await c.getUserPicks(this.userId,this.leagueId),n=this.calculateEliminations(a,s);this.leagueData={leagueId:e.leagueId,leagueName:e.name,lastProcessedRace:{raceName:"Bahrain Grand Prix",processedAt:new Date().toISOString()},eliminatedPlayers:n.length,activePlayers:t.length-n.length},this.userStatus={userId:this.userId,isEliminated:n.some(o=>o.userId===this.userId),survivedRaces:s.length,totalPicks:s.length},this.eliminations=n,this.standings=a,console.log("Real league data loaded:",{leagueData:this.leagueData,userStatus:this.userStatus,eliminations:this.eliminations,standings:this.standings})}catch(e){throw console.error("Failed to load real league data:",e),e}}render(){if(!this.leagueData||!this.userStatus){this.showError("No league data available");return}this.container.innerHTML=`
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
    `}renderSimpleView(){const{lastProcessedRace:e}=this.leagueData,{eliminatedPlayers:t,activePlayers:a}=this.leagueData;return`
      <div class="ez-simple-view">
        <div class="ez-last-race">
          Last Race • ${e.raceName}
        </div>
        
        <div class="ez-elimination-count">
          ❌ <span class="eliminated">${t} ELIMINATED</span> / 
          <span class="remaining">${a} REMAINING</span>
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
      `;const e=D(this.eliminations,this.userId);return`
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
    `}renderStandings(){const e=C(this.standings,this.userId),t=e.slice(0,5),a=e.find(s=>s.userId===this.userId);return`
      <div class="ez-standings">
        <h4>Remaining Players</h4>
        <div class="ez-standings-list">
          ${t.map(s=>`
            <div class="ez-standing-item ${s.isCurrentUser?"current-user":""}">
              <div class="ez-standing-rank">${s.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${s.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(s.username)}</span>
              </div>
              <div class="ez-standing-stats">${s.status}</div>
            </div>
          `).join("")}
          
          ${a&&a.rank>5?`
            <div class="ez-standing-item current-user">
              <div class="ez-standing-rank">${a.rank}</div>
              <div class="ez-standing-name-pick">
                <span class="ez-standing-name">${a.username}</span>
                <span class="ez-standing-pick">Last: ${this.getLastPickForPlayer(a.username)}</span>
              </div>
              <div class="ez-standing-stats">${a.status}</div>
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
    `}setupAutoRefresh(){this.updateInterval=setInterval(()=>{this.shouldAutoRefresh()&&(console.log("Auto-refreshing elimination zone..."),this.refresh())},3e4)}shouldAutoRefresh(){const e=new Date,t=new Date(this.leagueData.lastProcessedRace.processedAt);return e.getTime()-t.getTime()<2*60*60*1e3}async refresh(){try{await this.loadRealData(),this.render()}catch(e){console.error("Failed to refresh elimination zone:",e)}}getOrdinalSuffix(e){const t=e%10,a=e%100;return t===1&&a!==11?"st":t===2&&a!==12?"nd":t===3&&a!==13?"rd":"th"}calculateEliminations(e,t){return[]}getLastPickForPlayer(e){const t=this.standings.find(a=>a.username===e);return t&&t.lastPick?t.lastPick.driverName:"No pick"}destroy(){this.updateInterval&&clearInterval(this.updateInterval)}}class P{constructor(){this.leagues=new Map,this.crossLeagueStats=null,this.currentDashboardLeague=null,this.isInitialized=!1,this.statsCache=null,this.statsCacheTime=0,this.statsCacheTimeout=3e4}async initialize(){if(!this.isInitialized)try{if(console.log("🏆 Initializing multi-league dashboard..."),!await l.isAuthenticated()){console.log("🏆 User not authenticated, showing solo dashboard"),this.showSoloDashboard(),this.isInitialized=!0;return}console.log("🏆 Starting with solo dashboard, will upgrade when leagues load..."),this.showSoloDashboard(),this.isInitialized=!0;const t=window.multiLeagueContext?window.multiLeagueContext.getMultiLeagueContext():null;t&&t.leagueCount>0&&(console.log(`🏆 Context already available, enhancing for ${t.leagueCount} leagues`),await this.enhanceExistingDashboard(t))}catch(e){console.error("Failed to initialize multi-league dashboard:",e),this.showSoloDashboard(),this.isInitialized=!0}}showSoloDashboard(){const e=document.getElementById("cross-league-overview"),t=document.getElementById("dashboard-league-tabs");e&&(e.style.display="none"),t&&(t.style.display="none"),this.updatePlayerStatusForSolo()}async enhanceExistingDashboard(e){await this.addCrossLeagueStatsSection(e),this.addLeagueDashboardTabs(e),await this.enhancePickHistoryForLeagues(e),this.enhancePlayerStatusForLeagues(e),this.setupDashboardTabEvents()}async addCrossLeagueStatsSection(e){const t=await this.calculateCrossLeagueStats(e),a=`
      <div id="cross-league-overview" class="cross-league-overview">
        <h2>Performance Across All Leagues</h2>
        <div class="cross-league-stats-grid">
          <div class="stat-card">
            <span class="stat-value">${t.totalLeagues}</span>
            <span class="stat-label">Active Leagues</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${t.overallSurvivalRate}%</span>
            <span class="stat-label">Overall Survival Rate</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${t.bestLeague}</span>
            <span class="stat-label">Best Performing League</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${t.totalPicks}</span>
            <span class="stat-label">Total Picks Made</span>
          </div>
        </div>
      </div>
    `,s=document.querySelector(".dashboard-container"),n=document.querySelector(".dashboard-top-row");s&&n&&n.insertAdjacentHTML("beforebegin",a)}addLeagueDashboardTabs(e){e.activeLeagueData;const t=window.multiLeagueContext?window.multiLeagueContext.getAllLeaguesContext():null,a=t?t.leagues:[];console.log("🏆 Creating dashboard tabs for leagues:",a);const s=`
      <div id="dashboard-league-tabs" class="dashboard-league-tabs">
        <button class="dashboard-tab ${this.currentDashboardLeague===null?"active":""}" data-league="all">
          All Leagues
        </button>
        ${a.map(o=>`
          <button class="dashboard-tab ${this.currentDashboardLeague===o.leagueId?"active":""}" 
                  data-league="${o.leagueId}">
            ${o.name}
          </button>
        `).join("")}
      </div>
    `,n=document.getElementById("cross-league-overview");n&&n.insertAdjacentHTML("afterend",s)}async enhancePickHistoryForLeagues(e){const t=document.querySelector(".pick-history-section h2");if(!t)return;const a=e.activeLeagueData,s=this.currentDashboardLeague===null?"All Leagues":a?a.name:"Current League";t.innerHTML=`Pick History - <span id="dashboard-league-name">${s}</span>`,await this.refreshPickHistory()}enhancePlayerStatusForLeagues(e){const t=document.querySelector(".player-name");if(document.querySelector(".survival-status"),t&&e.leagueCount>0){const a=e.activeLeagueData;a&&this.currentDashboardLeague!==null&&(t.textContent=`${t.textContent} - ${a.name}`)}}updatePlayerStatusForSolo(){const e=document.querySelector(".player-name");e&&(e.textContent="Player 1")}setupDashboardTabEvents(){document.querySelectorAll(".dashboard-tab").forEach(t=>{t.addEventListener("click",async a=>{const s=a.target.dataset.league;await this.switchDashboardLeague(s==="all"?null:s)})})}async switchDashboardLeague(e){console.log(`🏆 Switching dashboard view to league: ${e||"all"}`),this.currentDashboardLeague=e,document.querySelectorAll(".dashboard-tab").forEach(t=>{const a=t.dataset.league==="all"?null:t.dataset.league;t.classList.toggle("active",a===e)}),await this.refreshDashboardForLeague(e)}async refreshDashboardForLeague(e){var a;await this.refreshPickHistory();const t=document.getElementById("dashboard-league-name");if(t)if(e===null)t.textContent="All Leagues";else{const s=window.multiLeagueContext?window.multiLeagueContext.getMultiLeagueContext():null,n=(a=s==null?void 0:s.userLeagues)==null?void 0:a.find(o=>o.leagueId===e);t.textContent=n?n.name:"Current League"}console.log(`✅ Dashboard refreshed for league: ${e||"all"}`)}async refreshPickHistory(){try{let e;if(this.currentDashboardLeague===null){const t=await c.getMultiLeaguePickHistory();e=t.byLeague?Object.values(t.byLeague).flatMap(a=>a.picks||[]):[]}else e=await c.getUserPicks(null,this.currentDashboardLeague);this.updatePickHistoryDisplay(e)}catch(e){console.error("Failed to refresh pick history:",e)}}updatePickHistoryDisplay(e){const t=document.getElementById("pick-history-body"),a=document.getElementById("no-picks-message");if(!t)return;if(!e||e.length===0){a&&(a.style.display="block",a.innerHTML=this.currentDashboardLeague===null?'No picks made yet across any leagues. <a href="index.html">Make your first pick!</a>':'No picks made in this league yet. <a href="index.html">Make your first pick!</a>'),t.querySelectorAll(".pick-row").forEach(o=>o.remove());return}a&&(a.style.display="none"),t.querySelectorAll(".pick-row").forEach(n=>n.remove()),e.forEach(n=>{const o=this.createPickHistoryRow(n);t.appendChild(o)})}createPickHistoryRow(e){const t=document.createElement("div");t.className="pick-row";const a=this.currentDashboardLeague===null&&e.leagueName?` (${e.leagueName})`:"";return t.innerHTML=`
      <div class="pick-cell">${e.raceName||e.raceId}${a}</div>
      <div class="pick-cell">${e.driverName}</div>
      <div class="pick-cell">${e.finalPosition||"TBD"}</div>
      <div class="pick-cell">
        <span class="status-badge ${e.survived!==!1?"survived":"eliminated"}">
          ${e.survived!==!1?"Survived":"Eliminated"}
        </span>
      </div>
    `,t}async calculateCrossLeagueStats(e){try{const t=Date.now();if(this.statsCache&&t-this.statsCacheTime<this.statsCacheTimeout)return console.log("📊 Using cached cross-league statistics"),{...this.statsCache,totalLeagues:e.leagueCount};console.log("📊 Calculating fresh cross-league statistics...");const a=await c.getCrossLeagueStatistics(),s={totalLeagues:e.leagueCount,overallSurvivalRate:(a==null?void 0:a.overallSurvivalRate)||0,bestLeague:(a==null?void 0:a.bestLeague)||"N/A",totalPicks:(a==null?void 0:a.totalPicks)||0};return this.statsCache=s,this.statsCacheTime=t,console.log("📊 Cross-league statistics cached"),s}catch(t){return console.error("Failed to calculate cross-league stats:",t),{totalLeagues:e.leagueCount,overallSurvivalRate:0,bestLeague:"N/A",totalPicks:0}}}async refresh(){try{if(console.log("🏆 Refreshing multi-league dashboard...",new Error().stack.split(`
`)[2].trim()),!await l.isAuthenticated()){console.log("🏆 User not authenticated, showing solo dashboard"),this.showSoloDashboard();return}const t=window.multiLeagueContext?window.multiLeagueContext.getMultiLeagueContext():null;if(!t){console.log("🏆 No multi-league context available, showing solo dashboard"),this.showSoloDashboard();return}if(t.leagueCount===0){console.log("🏆 Context available but no leagues loaded yet (leagueCount: 0), showing solo dashboard"),this.showSoloDashboard();return}console.log(`🏆 Refreshing dashboard for ${t.leagueCount} leagues`,t);const a=[...document.querySelectorAll("#cross-league-overview"),...document.querySelectorAll("#dashboard-league-tabs"),...document.querySelectorAll(".cross-league-overview"),...document.querySelectorAll(".dashboard-league-tabs")];a.forEach(s=>s.remove()),console.log(`🧹 Cleaned up ${a.length} existing multi-league elements`),await this.enhanceExistingDashboard(t),this.isInitialized=!0}catch(e){console.error("Failed to refresh multi-league dashboard:",e),this.showSoloDashboard()}}}const y=new P;let f=null,h=null,m=null,u=!1;async function A(){try{console.log("Initializing multi-league UI components for dashboard...");const i=await E();window.multiLeagueContext=i,h=k("league-nav-selector"),await h.initialize(),window.leagueSelector=h,console.log("League selector initialized for dashboard"),console.log("Multi-league UI components initialized successfully for dashboard")}catch(i){console.error("Failed to initialize multi-league UI for dashboard:",i),console.log("Continuing dashboard without multi-league features")}}async function $(){try{console.log("Initializing authentication state management"),l.onAuthStateChange(e=>{v(e)});const i=await l.isAuthenticated();v(i),console.log("Authentication state management initialized")}catch(i){console.error("Failed to initialize authentication state:",i)}}async function v(i){var a;console.log("Updating UI for auth state:",i);const e=document.querySelectorAll(".sign-in"),t=document.querySelectorAll(".nav-link");if(i){try{const s=await l.getUserDisplayInfo(),n=(s==null?void 0:s.displayName)||((a=s==null?void 0:s.email)==null?void 0:a.split("@")[0])||(s==null?void 0:s.username)||"User";e.forEach(o=>{o.textContent=n,o.onclick=r=>{r.preventDefault(),r.stopPropagation(),p()},o.classList.add("authenticated")}),t.forEach(o=>{o.style.display="block"}),console.log("UI updated for authenticated user:",n)}catch(s){console.error("Error getting user info:",s),e.forEach(n=>{n.textContent="User",n.onclick=o=>{o.preventDefault(),o.stopPropagation(),p()},n.classList.add("authenticated")}),t.forEach(n=>{n.style.display="block"})}d()}else e.forEach(s=>{s.textContent="Sign In",s.onclick=()=>showAuthModal("signin"),s.classList.remove("authenticated")}),t.forEach(s=>{s.style.display="none"}),console.log("UI updated for unauthenticated user")}function d(){if(u){console.log("🏆 Dashboard refresh already in progress, skipping...");return}m&&clearTimeout(m),m=setTimeout(async()=>{if(!u){u=!0,console.log("🏆 Executing debounced dashboard refresh...");try{await y.refresh()}catch(i){console.error("Error in debounced dashboard refresh:",i)}finally{u=!1}}},300)}function p(){document.querySelectorAll(".user-menu").forEach(a=>a.remove());const e=document.createElement("div");e.className="user-menu",e.innerHTML=`
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
  `;const t=document.querySelector(".sign-in");if(t){const a=t.getBoundingClientRect();e.style.position="fixed",e.style.top=`${a.bottom+5}px`,e.style.right="20px",e.style.zIndex="9999",e.style.background="#ffffff",e.style.border="2px solid #374151",e.style.borderRadius="6px",e.style.padding="0.5rem",e.style.boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"}document.body.appendChild(e),setTimeout(()=>{document.addEventListener("click",function a(s){e.contains(s.target)||(e.remove(),document.removeEventListener("click",a))})},100)}async function M(){try{console.log("Signing out user");const i=await l.signOut();i.success?(console.log("Sign out successful"),document.querySelectorAll(".user-menu").forEach(t=>t.remove()),v(!1),window.location.href="index.html"):console.error("Sign out failed:",i.error)}catch(i){console.error("Sign out error:",i)}}async function b(){try{console.log("Initializing dashboard..."),R(),await $(),await y.initialize();const i=()=>{if(window.multiLeagueContext){const t=window.multiLeagueContext.getMultiLeagueContext();return t&&t.leagueCount>0?(console.log("🔄 Multi-league context available with leagues, refreshing dashboard..."),d()):console.log("🔄 Multi-league context available but no leagues yet, waiting..."),window.multiLeagueContext.addLeagueChangeListener(a=>{console.log("🔄 Multi-league context changed, refreshing dashboard...",a),d()}),!0}return!1};if(window.dashboardLeagueChangeListenerAdded||(document.addEventListener("leagueChanged",t=>{console.log("🔄 League changed event received:",t.detail),setTimeout(()=>{d()},100)}),window.dashboardLeagueChangeListenerAdded=!0),!i()){let t=!1;const a=setInterval(()=>{!t&&i()&&(t=!0,clearInterval(a))},200);setTimeout(()=>{t||console.log("🔄 Multi-league context setup timed out, continuing with solo mode"),clearInterval(a)},1e4)}S(),f=await I(),console.log("Dashboard data loaded:",f);const e=document.getElementById("elimination-zone-container");if(e){const t=new x(e);let a=0;const s=20,n=async()=>{await l.isAuthenticated()?(console.log("Authentication confirmed, initializing elimination zone..."),await t.initialize()):a<s?(console.log(`Waiting for authentication... (${a+1}/${s})`),a++,setTimeout(n,500)):console.log("Authentication timeout, skipping elimination zone initialization")};n()}w(),console.log("Dashboard initialized successfully")}catch(i){console.error("Error initializing dashboard:",i),w(),T("Failed to load dashboard data. Please try refreshing the page.")}}function R(){const i=document.getElementById("dashboard-loading");i&&i.classList.add("active")}function w(){const i=document.getElementById("dashboard-loading");i&&i.classList.remove("active")}function T(i){const e=document.createElement("div");e.className="error-notification",e.innerHTML=`
    <div class="error-content">
      <h3>Error</h3>
      <p>${i}</p>
      <button onclick="this.parentElement.parentElement.remove()">Close</button>
    </div>
  `,document.body.appendChild(e),setTimeout(()=>{e.parentElement&&e.remove()},5e3)}async function N(){console.log("Refreshing dashboard..."),await b()}window.showAuthModal=async(i="signin")=>{await L.showModal(i)};window.handleSignOut=M;document.addEventListener("DOMContentLoaded",async()=>{await A(),await b()});window.addEventListener("storage",i=>{i.key==="f1survivor_user_picks"&&(console.log("User picks changed, refreshing dashboard..."),N())});
