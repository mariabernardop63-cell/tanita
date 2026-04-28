// home.js GÇö MozPay Home Premium Logic

document.addEventListener('DOMContentLoaded', async () => {

    // ============================================
    // SUPABASE AUTHENTICATION & PROFILE
    // ============================================
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    // Initialize Chatbot Sasha FIRST (Ensure visibility even if other logic fails)
    console.log('=ƒñû Sasha IA: Initializing Global Integration (Priority)...');
    initChatbotAnimations();
    initChatModal();

    const metadata = session.user.user_metadata || {};
    const fullName = metadata.full_name || 'Utilizador';
    const firstName = fullName.split(' ')[0];
    const userPhone = session.user.phone || metadata.phone || '';
    let userEmail = metadata.contact_email || (session.user.email && !session.user.email.includes('@mozpay.internal') ? session.user.email : '');
    if (!userEmail && metadata.email) userEmail = metadata.email; 
    
    // Get registration date
    const createdAt = new Date(session.user.created_at);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const memberSinceStr = `${monthNames[createdAt.getMonth()]} ${createdAt.getFullYear()}`;
    
    const getInitialsLocal = (name) => {
        const p = name.trim().split(' ');
        if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
        return p[0].slice(0, 2).toUpperCase() || 'U';
    };

    // Generate a deterministic color based on user name (consistent across sessions)
    const getAvatarColor = (name) => {
        const colors = [
            '#1D4ED8', '#7C3AED', '#BE185D', '#065F46',
            '#92400E', '#1E3A8A', '#6D28D9', '#047857',
            '#9D174D', '#B45309', '#0369A1', '#7E22CE',
            '#166534', '#9A3412', '#5B21B6', '#0E7490'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };
    const avatarColor = getAvatarColor(fullName);
    const userInitials = getInitialsLocal(fullName);

    const userId = session.user.id;
    const getStorageKey = (key) => `mozpay_${userId}_${key}`;

    // Persistence: Load settings
    let balanceVisible = localStorage.getItem('mozpay_balance_visible') !== 'false';
    // Load avatar: prefer Supabase user_metadata, fallback to localStorage
    let savedAvatar = metadata.avatar_url || localStorage.getItem(getStorageKey('user_avatar'));

    // Override Balance to 0
    document.querySelectorAll('#balanceDisplay, #balanceDisplayProfileHero').forEach(el => {
        if(el) el.textContent = '0,00';
    });
    
    let userBalance = 0;
    let dailyEarnings = [];
    let extratoData = []; // Moved from below

    // ============================================
    // INVESTMENT AND MISSIONS STATE
    // ============================================
    // Load investment state: prefer Supabase user_metadata (cross-device), fallback to localStorage
    let activeInvestment = null;
    if (metadata.active_investment) {
        activeInvestment = typeof metadata.active_investment === 'string'
            ? JSON.parse(metadata.active_investment)
            : metadata.active_investment;
    } else {
        activeInvestment = JSON.parse(localStorage.getItem(getStorageKey('active_investment'))) || null;
    }

    let missionsState = {};
    if (metadata.missions_state) {
        missionsState = typeof metadata.missions_state === 'string'
            ? JSON.parse(metadata.missions_state)
            : metadata.missions_state;
    } else {
        missionsState = JSON.parse(localStorage.getItem(getStorageKey('missions_state'))) || {};
    }
    
    const levelMissionSchedules = {
        '01': [ { time: '08:00', amt: 5 }, { time: '12:00', amt: 5 }, { time: '14:00', amt: 5 } ],
        '02': [ { time: '08:00', amt: 12 }, { time: '12:00', amt: 10 }, { time: '16:00', amt: 10 } ],
        '03': [ { time: '08:00', amt: 30 }, { time: '12:00', amt: 20 }, { time: '15:00', amt: 15 }, { time: '20:00', amt: 10 } ],
        '04': [ { time: '08:00', amt: 55 }, { time: '12:00', amt: 40 }, { time: '16:00', amt: 40 }, { time: '20:00', amt: 30 } ],
        '05': [ { time: '08:00', amt: 125 }, { time: '12:00', amt: 100 }, { time: '15:00', amt: 75 }, { time: '18:00', amt: 50 }, { time: '21:00', amt: 25 } ],
        '06': [ { time: '08:00', amt: 250 }, { time: '12:00', amt: 200 }, { time: '16:00', amt: 200 }, { time: '20:00', amt: 150 } ],
    };

    function saveInvestmentState() {
        localStorage.setItem(getStorageKey('active_investment'), JSON.stringify(activeInvestment));
        localStorage.setItem(getStorageKey('missions_state'), JSON.stringify(missionsState));
        // Sync to Supabase so state persists across devices
        supabaseClient.auth.updateUser({
            data: {
                active_investment: activeInvestment,
                missions_state: missionsState
            }
        }).catch(err => console.warn('Investment sync failed:', err));
    }
    
    async function addTransactionToDB(type, desc, sub, amount, wallet = null) {
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        
        const newTx = {
            user_id: userId,
            type: type,
            description: desc,
            sub_description: sub,
            amount: amount,
            wallet_provider: wallet
        };

        const { data, error } = await supabaseClient.from('transactions').insert([newTx]).select().single();
        if (error) console.error("Extrato DB error:", error);

        extratoData.unshift({
            id: data ? data.id : null,
            type: type,
            desc: desc,
            sub: sub,
            amount: amount,
            time: timeStr,
            date: 'Hoje',
            wallet: wallet
        });
        
        renderRecentTransactions();
    }

    async function syncWalletToDB(bonusClaimedUpdate = null) {
        const updates = { 
            balance: userBalance,
            daily_earnings: dailyEarnings
        };
        if (bonusClaimedUpdate !== null) updates.bonus_claimed = bonusClaimedUpdate;

        const { error } = await supabaseClient.from('wallets').update(updates).eq('user_id', userId);
        
        if (error) {
            await supabaseClient.from('wallets').upsert([{ user_id: userId, ...updates }]);
        }
    }

    async function loadUserData() {
        try {
            // Fetch wallet
