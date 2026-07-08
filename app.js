const categoryConfig = {
  'e-waste': { label: 'E-Waste', color: '#C4501F' },
  'glass': { label: 'Glass', color: '#4A6B3A' },
  'metal': { label: 'Metal / Bhangar', color: '#6B6355' },
  'paper-cardboard': { label: 'Paper / Pasti', color: '#7A8B3F' },
  'plastic': { label: 'Plastic', color: '#2F6B4F' },
  'organic-food': { label: 'Food / Wet Waste', color: '#B38B2D' },
  'agricultural': { label: 'Agro Waste / Parali', color: '#8A5D2E' },
  'furniture': { label: 'Wood & Furniture', color: '#6E473B' },
  'trash': { label: 'Trash / Mixed Waste', color: '#8A3324' }
};

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const analyzing = document.getElementById('analyzing');
const mapFrame = document.getElementById('mapFrame');

const homeVideoConfig = [
  { title: 'Waste sorting overview', subtitle: 'Add your provided video link or file path here', src: '', poster: '' },
  { title: 'How to upload waste photos', subtitle: 'Short guide for first-time users', src: '', poster: '' },
  { title: 'Recycling tips and local recovery', subtitle: 'Useful examples for viewers', src: '', poster: '' }
];

// Set this to your walkthrough video's YouTube ID (the part after "v=" in the URL)
const HELP_VIDEO_YOUTUBE_ID = "8SO5I8MJsnU"; // <-- replace with your actual tutorial video ID

const categoryShowcase = [
  {
    key: 'agricultural',
    title: 'Agricultural waste',
    article: 'Do not burn farm residue. Rice straw, wheat straw, cotton stalks, and bagasse can be collected, processed, and sold for biomass, pellets, pulp, or clean energy.',
    highlight: 'Make money from your agricultural waste',
    youtubeId: '1e6-R6Vvtog', // e.g. 'abcd1234xyz' - paste a YouTube video ID to show a video instead of an image
    video: '',       // or a local video file path, e.g. 'videos/agri.mp4'
    image: ''
  },
  {
    key: 'e-waste',
    title: 'E-waste',
    article: 'Old phones, chargers, batteries, and computers contain recoverable metal. Send them to certified recyclers to keep toxins out of landfills and recover value.',
    highlight: 'Recover metal and parts',
    youtubeId: '',
    video: '',
    image: 'e waste.jpg'
  },
  {
    key: 'plastic',
    title: 'Plastic',
    article: 'Clean plastic bottles and packaging can be reused by many companies for new products, packaging, and recycling streams. Keep it clean and sorted.',
    highlight: 'Many companies reuse it',
    youtubeId: 'hzGWWMNtxyw',
    video: '',
    image: ''
  },
  {
    key: 'metal',
    title: 'Metal',
    article: 'Scrap metal has strong resale value. Iron, steel, copper, brass, and aluminum can be collected and sold to scrap buyers and processing units.',
    highlight: 'Strong buyback value',
    youtubeId: '',
    video: 'metal-waste.mp4',
    image: 'dataset/dataset-resized/metal/metal1.jpg'
  },
  {
    key: 'paper-cardboard',
    title: 'Paper and cardboard',
    article: 'Boxes, newspapers, office paper, and cardboard are easy to recycle. Keep them dry and clean so they can be sold or reprocessed faster.',
    highlight: 'Easy to sort and sell',
    youtubeId: '',
    video: 'paper-waste.mp4',
    image: 'dataset/paper-cardboard/cardboard_cardboard1.jpg'
  },
  {
    key: 'glass',
    title: 'Glass',
    article: 'Glass bottles and containers are reusable and recyclable when collected properly. Return intact bottles where possible and sort broken glass safely.',
    highlight: 'Reuse first, then recycle',
    youtubeId: 'w8Zj-xzso2M',
    video: '',
    image: ''
  },
  {
    key: 'trash',
    title: 'Mixed trash',
    article: 'Mixed trash is the last choice. Separate recyclable pieces first so less material ends up in landfill and more can be recovered.',
    highlight: 'Separate before disposal',
    youtubeId: 'tZEM5K72aVs',
    video: '',
    image: ''
  }
];

let wasteData = {};
let datasetSummary = {};
let activeCategory = 'e-waste';
let quantityMode = 'all';

// GPS location
let userCoords = null;

// TensorFlow Edge AI models
let classifierModel = null;
let isModelLoading = true;

function renderHomeVideos() {
  const grid = document.getElementById('homeVideoGrid');
  if (!grid) return;

  grid.innerHTML = homeVideoConfig.map((item, index) => {
    if (item.src) {
      return `
        <article class="home-video-card">
          <video class="home-video-player" controls preload="metadata" ${item.poster ? `poster="${item.poster}"` : ''}>
            <source src="${item.src}">
          </video>
          <div class="home-video-meta">
            <strong>${item.title}</strong>
            <span>${item.subtitle}</span>
          </div>
        </article>
      `;
    }

    return `
      <article class="home-video-card home-video-empty">
        <div class="home-video-placeholder">
          <span class="home-video-play">▶</span>
          <strong>${item.title}</strong>
          <span>${item.subtitle}</span>
          <em>Set <code>homeVideoConfig</code> in <code>app.js</code> to your video file or URL.</em>
        </div>
      </article>
    `;
  }).join('');
}

function renderCategoryShowcase() {
  const grid = document.getElementById('categoryShowcaseGrid');
  if (!grid) return;

  grid.innerHTML = categoryShowcase.map((item) => {
    let mediaHtml;
    if (item.youtubeId) {
      mediaHtml = `<iframe src="https://www.youtube.com/embed/${item.youtubeId}?modestbranding=1&rel=0&iv_load_policy=3&showinfo=0" title="${item.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    } else if (item.video) {
      mediaHtml = `<video controls preload="metadata" src="${item.video}"></video>`;
    } else if (item.image) {
      mediaHtml = `<img src="${item.image}" alt="${item.title} sample" loading="lazy">`;
    } else {
      mediaHtml = `<div class="showcase-media-placeholder">Add a video or image for<br><strong>${item.title}</strong> in <code>categoryShowcase</code> (app.js)</div>`;
    }

    return `
      <article class="showcase-row" data-category-key="${item.key}">
        <div class="showcase-media">${mediaHtml}</div>
        <div class="showcase-text">
          <div class="showcase-label">${item.key === 'agricultural' ? 'Highlight' : 'Category guide'}</div>
          <h4 class="showcase-title">${item.title}</h4>
          <p class="showcase-article">${item.article}</p>
          <span class="showcase-highlight">${item.highlight}</span>
        </div>
      </article>
    `;
  }).join('');

  grid.querySelectorAll('.showcase-row[data-category-key]').forEach((row) => {
    row.querySelector('.showcase-text').addEventListener('click', () => {
      const key = row.getAttribute('data-category-key');
      if (key && categoryConfig[key]) {
        initiateCategoryRouting(key);
      }
    });
    row.querySelector('.showcase-text').style.cursor = 'pointer';
  });
}

// ===== Help modal (floating "?" button -> YouTube walkthrough) =====
function openHelpModal() {
  const overlay = document.getElementById('helpModalOverlay');
  const iframe = document.getElementById('helpModalIframe');
  if (!overlay || !iframe) return;
  iframe.src = `https://www.youtube.com/embed/${HELP_VIDEO_YOUTUBE_ID}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0`;
  overlay.classList.add('open');
}

function closeHelpModal() {
  const overlay = document.getElementById('helpModalOverlay');
  const iframe = document.getElementById('helpModalIframe');
  if (!overlay || !iframe) return;
  iframe.src = ''; // stop video playback when closed
  overlay.classList.remove('open');
}

function closeHelpModalOnOverlay(event) {
  if (event.target.id === 'helpModalOverlay') {
    closeHelpModal();
  }
}

window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;
window.closeHelpModalOnOverlay = closeHelpModalOnOverlay;

function smoothMoveToMessageSystem() {
  // Activate chat mode: hide intro sections, show full chat panel
  const leftPanel = document.querySelector('.left-panel');
  if (leftPanel && !leftPanel.classList.contains('chat-active')) {
    leftPanel.classList.add('chat-active');
  }

  // Set chat-active on header to simplify UI
  const header = document.querySelector('header');
  if (header) {
    header.classList.add('chat-active');
  }
  
  // Hide the corner help button when chatting
  const welcomeHelp = document.getElementById('welcomeHelpCorner');
  if (welcomeHelp) {
    welcomeHelp.style.display = 'none';
  }

  // Also switch main away from chat-only-mode if needed to show both panels
  const mainEl = document.querySelector('main');
  if (mainEl && mainEl.classList.contains('chat-only-mode')) {
    mainEl.classList.remove('chat-only-mode');
    mainEl.classList.add('chat-only-mode'); // keep it - just need to refresh
  }
  // Scroll chat messages to bottom
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
  }
}

// Load local TensorFlow.js MobileNet Model
async function initClassifier() {
  try {
    console.log('Initializing TF.js MobileNet classifier...');
    classifierModel = await mobilenet.load();
    isModelLoading = false;
    console.log('TF.js model loaded successfully.');
  } catch (err) {
    console.error('Error loading TF.js model:', err);
    isModelLoading = false;
  }
}

// Fallback data for offline/local (CORS file:// protocol) use
const fallbackDatasetSummary = {
  "categories": [
    {
      "name": "e-waste",
      "imageCount": 626,
      "sampleImages": [
        "Battery_train_battery_0.jpg",
        "Battery_train_battery_1.jpg",
        "Battery_train_battery_10.jpg",
        "Battery_train_battery_100.jpg",
        "Battery_train_battery_101.jpg"
      ]
    },
    {
      "name": "glass",
      "imageCount": 501,
      "sampleImages": [
        "glass1.jpg",
        "glass10.jpg",
        "glass100.jpg",
        "glass101.jpg",
        "glass102.jpg"
      ]
    },
    {
      "name": "metal",
      "imageCount": 410,
      "sampleImages": [
        "metal1.jpg",
        "metal10.jpg",
        "metal100.jpg",
        "metal101.jpg",
        "metal102.jpg"
      ]
    },
    {
      "name": "paper-cardboard",
      "imageCount": 997,
      "sampleImages": [
        "cardboard_cardboard1.jpg",
        "cardboard_cardboard10.jpg",
        "cardboard_cardboard100.jpg",
        "cardboard_cardboard101.jpg",
        "cardboard_cardboard102.jpg"
      ]
    },
    {
      "name": "plastic",
      "imageCount": 482,
      "sampleImages": [
        "plastic1.jpg",
        "plastic10.jpg",
        "plastic100.jpg",
        "plastic101.jpg",
        "plastic102.jpg"
      ]
    },
    {
      "name": "trash",
      "imageCount": 137,
      "sampleImages": [
        "trash1.jpg",
        "trash10.jpg",
        "trash100.jpg",
        "trash101.jpg",
        "trash102.jpg"
      ]
    }
  ]
};

const fallbackWasteLocations = {
  "e-waste": [
    {
      "name": "Ecoli Waste Management",
      "address": "Trade Square, Dharm Nagar II, Sabarmati, Ahmedabad, Gujarat 380005",
      "lat": 23.0742389,
      "lng": 72.5920622,
      "phone": "+91 70464 69000",
      "rating": 4.9,
      "notes": "GPCB and AMC authorized e-waste recycler with free pickup.",
      "itemExamples": [
        "washing machine",
        "fridge",
        "microwave",
        "large appliances"
      ],
      "offerType": "Pays ₹250 – ₹1,200 per device / ₹55 per kg for circuit scrap",
      "quantityAdvice": "For 1-2 large appliances, pickup is easy; for bulk, ask for a commercial collection and better resale value.",
      "bulkGuide": "Offices, shops, and housing societies can schedule bulk appliance pickup for higher returns.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "ECS Environment Pvt Ltd",
      "address": "Vastrapur, Ahmedabad, Gujarat 380015",
      "lat": 23.0303328,
      "lng": 72.5306837,
      "phone": "+91 89800 04000",
      "rating": 4.2,
      "notes": "Authorized partner for safe electronics and battery recycling.",
      "itemExamples": [
        "mobile phone",
        "laptop",
        "tablet",
        "small gadgets"
      ],
      "offerType": "Pays ₹100 – ₹800 per mobile/laptop / ₹45/kg for computer scrap",
      "quantityAdvice": "For 1-2 devices, you can usually get a quick payout; for more than 5 devices, ask for a business pickup.",
      "bulkGuide": "Schools, startups, and call centers can arrange regular collection for small electronics.",
      "quantityFit": [
        "single"
      ]
    },
    {
      "name": "Atul Electronics Recycling",
      "address": "Sarkhej, Ahmedabad, Gujarat 382210",
      "lat": 22.9674398,
      "lng": 72.4940012,
      "phone": "+91 97240 09876",
      "rating": 4.4,
      "notes": "Accepts laptops, phones, and circuit boards with proper data destruction.",
      "itemExamples": [
        "phone",
        "laptop",
        "circuit board",
        "monitor"
      ],
      "offerType": "Pays ₹60 per kg for wires/cables, ₹500 per desktop tower",
      "quantityAdvice": "1-2 units are simple; bulk lots can be collected as a corporate pickup.",
      "bulkGuide": "Companies can bring multiple devices in one pickup for better pricing.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Mahesh N Dantani - Bahucharaji Traders",
      "address": "Shahibaug, Ahmedabad, Gujarat 380004",
      "lat": 23.0583,
      "lng": 72.596,
      "phone": "+91 89519 28379",
      "rating": 4.0,
      "notes": "Jd Trusted. Specializes in e-waste buyback, home scrap appliances, and old cables.",
      "itemExamples": [
        "mobile phone",
        "laptop",
        "cable",
        "scrap electronics"
      ],
      "offerType": "Pays ₹45/kg for scrap computer units, ₹65/kg for copper cables",
      "quantityAdvice": "Perfect for fast cash on 1-2 old appliances or adapters.",
      "bulkGuide": "Residential societies can group together for a larger collective pickup.",
      "quantityFit": [
        "single"
      ]
    },
    {
      "name": "Kamlesh Traders",
      "address": "Satellite, Ahmedabad, Gujarat 380015",
      "lat": 23.0298,
      "lng": 72.5187,
      "phone": "+91 89519 21781",
      "rating": 4.5,
      "notes": "Jd Trusted. Accepts computer peripherals, monitors, and television scrap.",
      "itemExamples": [
        "monitor",
        "television",
        "printer",
        "computer keyparts"
      ],
      "offerType": "Pays ₹300 per TV/monitor, ₹50 per printer, ₹150 for old UPS",
      "quantityAdvice": "Good choice for domestic electronics disposal.",
      "bulkGuide": "Offices nearby can request single-lot collection for system upgrades.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "JDB Scrap Traders",
      "address": "Motera, Ahmedabad, Gujarat 380005",
      "lat": 23.1026,
      "lng": 72.5997,
      "phone": "+91 96060 64547",
      "rating": 3.2,
      "notes": "General scrap and basic electronics recycling.",
      "itemExamples": [
        "cables",
        "old adapters",
        "appliances"
      ],
      "offerType": "Pays ₹35 per kg for mixed electronics, ₹55/kg for lead batteries",
      "quantityAdvice": "Ideal for scrap sorting drop-offs.",
      "bulkGuide": "Accepts larger scrap collections from local garages and repair shops.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Jay Bhawani Scrap Traders",
      "address": "Satellite, Ahmedabad, Gujarat 380015",
      "lat": 23.0235,
      "lng": 72.521,
      "phone": "+91 96069 06134",
      "rating": 4.4,
      "notes": "E-waste collection, old battery scrap, and aluminum/copper waste.",
      "itemExamples": [
        "battery",
        "old wires",
        "electronic scrap"
      ],
      "offerType": "Pays ₹70 per kg for batteries, ₹150 per desktop motherboards",
      "quantityAdvice": "Provides quick evaluation and instant cash payout.",
      "bulkGuide": "Arranges pickup truck for larger commercial loads.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Jay Bhavani Scrap",
      "address": "Satellite, Ahmedabad, Gujarat 380015",
      "lat": 23.021,
      "lng": 72.5284,
      "phone": "+91 89519 57649",
      "rating": 4.1,
      "notes": "Jd Trusted. Bulk e-waste disposal, office IT asset recycling, and appliance buyback.",
      "itemExamples": [
        "computer tower",
        "server",
        "UPS",
        "printer"
      ],
      "offerType": "Pays ₹450 per server board, ₹60/kg for mixed IT scrap",
      "quantityAdvice": "Excellent rates for server boards and office desktop towers.",
      "bulkGuide": "Recommended for commercial complexes and shops doing warehouse cleanouts.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Mahavir Scrap",
      "address": "Memnagar, Ahmedabad, Gujarat 380052",
      "lat": 23.0494,
      "lng": 72.535,
      "phone": "+91 99457 31672",
      "rating": 4.5,
      "notes": "IT scrap buyer, scrap motherboards, laptop components, and processors.",
      "itemExamples": [
        "laptop",
        "motherboard",
        "processor",
        "RAM"
      ],
      "offerType": "Pays ₹250 for dead laptops, ₹120 for desktop CPUs, ₹40 for RAM modules",
      "quantityAdvice": "Offers higher rates for functioning processors or clean circuit boards.",
      "bulkGuide": "IT repair shops can set up recurring collection agreements.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Shri Dev Scrap",
      "address": "Hanspura, Ahmedabad, Gujarat 382330",
      "lat": 23.061,
      "lng": 72.673,
      "phone": "+91 89518 70933",
      "rating": 3.0,
      "notes": "Local village/suburb scrap dealer collecting household battery and wire waste.",
      "itemExamples": [
        "household battery",
        "copper wiring",
        "small electronics"
      ],
      "offerType": "Pays ₹30 per kg for batteries, ₹60/kg for household wires",
      "quantityAdvice": "Best for quick community drop-off of wire bundles.",
      "bulkGuide": "Aggregates scrap with local village vendors.",
      "quantityFit": [
        "single"
      ]
    },
    {
      "name": "Madhav Pastiwala",
      "address": "Shop-14, Madhav Complex, Near Vasna Bus Station, Jivraj Mehta Hospital Road, Vasna, Ahmedabad, Gujarat 380007",
      "lat": 23.0035,
      "lng": 72.5414,
      "phone": "+91 88666 96614",
      "rating": 4.4,
      "notes": "GPCB and AMC authorized Pastiwala collecting electronic scrap, papers, and cardboard door-to-door.",
      "itemExamples": [
        "laptop",
        "newspaper",
        "box",
        "plastic bottle",
        "e-waste"
      ],
      "offerType": "Pays ₹300 per laptop, ₹15/kg for newspaper, ₹9/kg for cardboard",
      "quantityAdvice": "Best for mixed home cleanups (e-waste, papers, and plastics together).",
      "bulkGuide": "Residential societies can book regular weekly scrap collections.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Recycling Hub",
      "address": "B 403, One World Capital, Bodakdev, Ahmedabad, Gujarat 380054",
      "lat": 23.0378,
      "lng": 72.512,
      "phone": "+91 77780 40173",
      "rating": 4.8,
      "notes": "GPCB-authorized industrial and commercial e-waste management company.",
      "itemExamples": [
        "server racks",
        "PCB boards",
        "heavy batteries",
        "IT equipment"
      ],
      "offerType": "Pays ₹75 per kg for PCB boards, commercial bulk weight pricing",
      "quantityAdvice": "Requires cataloged lists of retired hardware for pickup.",
      "bulkGuide": "Perfect for corporate offices, IT parks, and factories seeking authorized disposal.",
      "quantityFit": [
        "bulk"
      ]
    }
  ],
  "glass": [
    {
      "name": "Glass Cycle Ahmedabad",
      "address": "Kubernagar, Ahmedabad, Gujarat 382350",
      "lat": 23.0564616,
      "lng": 72.6358057,
      "phone": "+91 98980 11888",
      "rating": 4.5,
      "notes": "Collects bottles, jars, and broken glass for recycling.",
      "itemExamples": [
        "glass bottles",
        "jars",
        "broken glass"
      ],
      "offerType": "Pays ₹2.00 per empty beer/liquor bottle / ₹1.00 per clean jar",
      "quantityAdvice": "For 1-2 bags, a local collection point is best; for bulk, schedule a pickup.",
      "bulkGuide": "Hotels, bars, and restaurants can arrange bulk glass collection for better logistics.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Savla Glass Recycling",
      "address": "Naroda, Ahmedabad, Gujarat 382330",
      "lat": 23.0688636,
      "lng": 72.6503218,
      "phone": "+91 98765 22211",
      "rating": 4.3,
      "notes": "Handles glass sorting for packaging waste and industrial reuse.",
      "itemExamples": [
        "wine bottles",
        "beer bottles",
        "industrial glass"
      ],
      "offerType": "Pays ₹1.50 per intact ketchup bottle / Free disposal for broken glass",
      "quantityAdvice": "Smaller loads can be dropped off; large loads should be booked as a commercial pickup.",
      "bulkGuide": "Retailers and manufacturing units can request scheduled bulk pickup.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Arihant Bottle Recovery",
      "address": "Vatva, Ahmedabad, Gujarat 382440",
      "lat": 22.9874057,
      "lng": 72.6287574,
      "phone": "+91 98745 33441",
      "rating": 4.1,
      "notes": "Specializes in bottle and jar recycling for industrial supply chains.",
      "itemExamples": [
        "glass bottles",
        "jars",
        "industrial containers"
      ],
      "offerType": "Pays ₹1.20 per jar / ₹800 per ton for crushed glass cullet",
      "quantityAdvice": "Best for bulk quantities from businesses; smaller household loads can also be accepted.",
      "bulkGuide": "Factories and warehouses can get better rates for regular bulk collection.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Gujarat Glass Recyclers",
      "address": "Odhav GIDC, Ahmedabad, Gujarat 382415",
      "lat": 23.0234,
      "lng": 72.6567,
      "phone": "+91 79228 19876",
      "rating": 4.4,
      "notes": "Large-scale cullet aggregator buying broken window glass and industrial containers.",
      "itemExamples": [
        "broken window glass",
        "industrial jars",
        "clear glass sheets"
      ],
      "offerType": "Pays ₹1,000 per metric ton for clean sorted clear glass cullet",
      "quantityAdvice": "Best for commercial glass installers and demolition firms.",
      "bulkGuide": "Schedules heavy dump trucks for scrap glass deliveries.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Shreenath Jars & Bottles",
      "address": "Nikol, Ahmedabad, Gujarat 382350",
      "lat": 23.0789,
      "lng": 72.6456,
      "phone": "+91 99245 88990",
      "rating": 4.2,
      "notes": "Household and grocery bottles buyback service. High reuse rates.",
      "itemExamples": [
        "jam jars",
        "sauce bottles",
        "honey jars"
      ],
      "offerType": "Pays ₹1.00 per clean jam/honey jar, ₹1.50 per sauce bottle",
      "quantityAdvice": "Great for neighborhood collections and households.",
      "bulkGuide": "Aggregates retail grocery store returns.",
      "quantityFit": [
        "single"
      ]
    }
  ],
  "metal": [
    {
      "name": "ScrapBazar",
      "address": "Gheekanta, Dariyapur, Ahmedabad, Gujarat 380001",
      "lat": 23.0352954,
      "lng": 72.5898135,
      "phone": "+91 99094 32222",
      "rating": 4.8,
      "notes": "Free pickup and competitive rates for scrap metal and appliances.",
      "itemExamples": [
        "iron",
        "steel",
        "copper",
        "appliances"
      ],
      "offerType": "Pays ₹480/kg for Copper wire, ₹110/kg for Aluminum cans, ₹26/kg for Iron scrap",
      "quantityAdvice": "For 1-2 small scrap pieces, drop-off is easy; for heavy loads, ask for free pickup.",
      "bulkGuide": "Factories and warehouses should use bulk pickup for better pricing.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Jay Bhavani Pasti Bhandar",
      "address": "Satellite, Shyamal, Ahmedabad, Gujarat 380015",
      "lat": 23.0105019,
      "lng": 72.5284087,
      "phone": "+91 95587 61423",
      "rating": 4.9,
      "notes": "Buys iron, steel, copper, and other metal scrap.",
      "itemExamples": [
        "iron scrap",
        "old utensils",
        "steel parts"
      ],
      "offerType": "Pays ₹500/kg for Copper, ₹95/kg for Aluminum, ₹24/kg for Iron sheets",
      "quantityAdvice": "Small loads can be sold quickly; bulk quantities get better rates and faster pickup.",
      "bulkGuide": "Construction sites and workshops should book bulk collection for regular scrap.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Shree Metal Scrap Hub",
      "address": "Rakhial, Ahmedabad, Gujarat 380023",
      "lat": 23.0403854,
      "lng": 72.6254176,
      "phone": "+91 97250 22334",
      "rating": 4.6,
      "notes": "Handles ferrous and non-ferrous metals with same-day pickup.",
      "itemExamples": [
        "heavy metal",
        "machinery parts",
        "copper wire"
      ],
      "offerType": "Pays ₹470/kg for Brass, ₹25/kg for Steel pipes, ₹27/kg for Cast Iron",
      "quantityAdvice": "Best for bulk or heavy metal loads from workshops and industries.",
      "bulkGuide": "Industrial units should schedule recurring pickup for high-volume scrap.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Gheekanta Iron Merchants",
      "address": "Gheekanta Road, Dariyapur, Ahmedabad, Gujarat 380001",
      "lat": 23.0335,
      "lng": 72.585,
      "phone": "+91 79253 90876",
      "rating": 4.3,
      "notes": "Specializes in iron rods, structural steel scrap, and industrial machine parts.",
      "itemExamples": [
        "iron rods",
        "beams",
        "machinery scrap",
        "steel sheets"
      ],
      "offerType": "Pays ₹25.50 per kg for clean structural iron and steel scrap",
      "quantityAdvice": "Strictly weight-based. Scales are certified by Weights & Measures.",
      "bulkGuide": "Contractors and demolishers can get daily market-linked rates.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Maruti Scrap Buyers",
      "address": "Vatva GIDC, Ahmedabad, Gujarat 382440",
      "lat": 22.9567,
      "lng": 72.6123,
      "phone": "+91 98255 11223",
      "rating": 4.5,
      "notes": "Buys industrial metals, heavy pipes, and high-value alloys. Instant UPI payouts.",
      "itemExamples": [
        "copper piping",
        "brass valves",
        "aluminum casting",
        "lead battery"
      ],
      "offerType": "Pays ₹490/kg for Copper tubes, ₹180/kg for Aluminum sections, ₹320/kg for Brass",
      "quantityAdvice": "Provides instant cash or UPI payouts on sorting.",
      "bulkGuide": "GIDC manufacturing units and machine shops.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Ahmedabad Alloys",
      "address": "Naroda GIDC, Ahmedabad, Gujarat 382330",
      "lat": 23.0823,
      "lng": 72.6612,
      "phone": "+91 97145 99001",
      "rating": 4.1,
      "notes": "Smelting and recycling yard. Accepts massive weight steel, casting, and rails.",
      "itemExamples": [
        "steel casting",
        "railway tracks",
        "machinery plates"
      ],
      "offerType": "Pays ₹27/kg for heavy cast iron scrap, ₹24.50/kg for light scrap steel",
      "quantityAdvice": "Requires transport weighbridge verification on-site.",
      "bulkGuide": "Suited for heavy engineering firms and scrap yards.",
      "quantityFit": [
        "bulk"
      ]
    }
  ],
  "paper-cardboard": [
    {
      "name": "Paper Hub Recycling",
      "address": "Maninagar, Ahmedabad, Gujarat 380008",
      "lat": 23.0008794,
      "lng": 72.6003036,
      "phone": "+91 98250 11444",
      "rating": 4.6,
      "notes": "Accepts cartons, paper bundles, and cardboard for recycling.",
      "itemExamples": [
        "paper bundles",
        "cardboard boxes",
        "cartons"
      ],
      "offerType": "Pays ₹15/kg for old newspapers (Pasti), ₹9/kg for cardboard boxes (Puttha)",
      "quantityAdvice": "1-2 boxes can be dropped off; larger office loads can be collected as a pickup.",
      "bulkGuide": "Offices and shops can arrange regular cardboard pickup for daily waste.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Green Box Recovery",
      "address": "Bopal, Ahmedabad, Gujarat 380058",
      "lat": 23.0616754,
      "lng": 72.4755832,
      "phone": "+91 98240 77777",
      "rating": 4.4,
      "notes": "Collection service for office paper and corrugated boxes.",
      "itemExamples": [
        "office paper",
        "corrugated boxes",
        "shipping cartons"
      ],
      "offerType": "Pays ₹14/kg for Pasti, ₹8.50/kg for carton boxes",
      "quantityAdvice": "Good for small household or office loads; bulk collection is recommended for bigger volumes.",
      "bulkGuide": "Warehouses and retailers can request scheduled pickups for higher volume cardboard.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Eco Paper Traders",
      "address": "Nikol, Ahmedabad, Gujarat 382350",
      "lat": 23.0875993,
      "lng": 72.6507531,
      "phone": "+91 98774 55666",
      "rating": 4.3,
      "notes": "Buys bulk paper and cardboard from offices and warehouses.",
      "itemExamples": [
        "bulk paper",
        "warehouse cardboard",
        "office stock"
      ],
      "offerType": "Pays ₹13/kg for office records/books, ₹8/kg for cardboard",
      "quantityAdvice": "Best for larger paper loads and commercial quantities.",
      "bulkGuide": "Hotels, offices, and factories should use this for large cardboard waste.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Laxmi Pasti Mart",
      "address": "Ranip, Ahmedabad, Gujarat 382480",
      "lat": 23.0765,
      "lng": 72.5645,
      "phone": "+91 98258 44556",
      "rating": 4.5,
      "notes": "Doorstep Pasti service using digital scales for high accuracy. Pays instantly via UPI.",
      "itemExamples": [
        "old books",
        "newspapers",
        "school notebooks",
        "magazines"
      ],
      "offerType": "Pays ₹16/kg for clean newspapers, ₹12/kg for old books & notebooks",
      "quantityAdvice": "Convenient doorstep collection for households.",
      "bulkGuide": "Schools and libraries can schedule batch disposal for clearance.",
      "quantityFit": [
        "single"
      ]
    },
    {
      "name": "Shanti Carton Traders",
      "address": "Kalupur, Ahmedabad, Gujarat 380001",
      "lat": 23.0289,
      "lng": 72.598,
      "phone": "+91 99043 22334",
      "rating": 4.2,
      "notes": "Major cardboard reseller. Buys intact shipping cartons for reuse at higher rates.",
      "itemExamples": [
        "intact shipping boxes",
        "kraft paper rolls",
        "corrugated sheets"
      ],
      "offerType": "Pays ₹12 per box for clean intact double-wall shipping cartons",
      "quantityAdvice": "Flat rate per box is much higher than weight scrap rate if cartons are reuseable.",
      "bulkGuide": "E-commerce hubs and warehouses.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    }
  ],
  "plastic": [
    {
      "name": "Recycle.Green",
      "address": "Titanium City Centre, Jodhpur Village, Ahmedabad, Gujarat 380015",
      "lat": 23.0125416,
      "lng": 72.5228987,
      "phone": "+91 93746 40691",
      "rating": 4.6,
      "notes": "Recycles plastic and tetrapak into reusable products.",
      "itemExamples": [
        "PET bottles",
        "HDPE containers",
        "packaging"
      ],
      "offerType": "Pays ₹12/kg for clean PET water bottles, ₹5/kg for LDPE carry bags",
      "quantityAdvice": "Single bags are easy to drop off; larger loads can be collected as a route pickup.",
      "bulkGuide": "Retail shops and food outlets can arrange regular bulk plastic collection.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Vikram Plastic Recycling",
      "address": "Sanand, Ahmedabad, Gujarat 382110",
      "lat": 22.9838803,
      "lng": 72.3734361,
      "phone": "+91 97123 88222",
      "rating": 4.2,
      "notes": "Handles rigid plastic and packaging waste collection.",
      "itemExamples": [
        "plastic packaging",
        "containers",
        "bottles"
      ],
      "offerType": "Pays ₹10/kg for PET bottles, ₹6/kg for high-density containers (HDPE)",
      "quantityAdvice": "Ideal for small household loads or small business waste; bulk can be scheduled by route.",
      "bulkGuide": "Manufacturing units and supermarkets should ask for recurring pickup.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Polymers India Recovery",
      "address": "Gota, Ahmedabad, Gujarat 382481",
      "lat": 23.1136276,
      "lng": 72.5442112,
      "phone": "+91 98243 77888",
      "rating": 4.5,
      "notes": "Processes PET, HDPE, and mixed packaging plastics.",
      "itemExamples": [
        "PET",
        "HDPE",
        "mixed packaging"
      ],
      "offerType": "Pays ₹11/kg for transparent bottles, ₹4/kg for soft plastics",
      "quantityAdvice": "Best for commercial or bulk plastic loads rather than single household bags.",
      "bulkGuide": "Factories and large retail chains should use this partner for frequent bulk disposal.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Patel Plastics & Grinding",
      "address": "Naroda GIDC, Ahmedabad, Gujarat 382330",
      "lat": 23.0805,
      "lng": 72.6489,
      "phone": "+91 99740 55432",
      "rating": 4.3,
      "notes": "Grinds rigid plastics like buckets, chairs, and toys for recycling aggregates.",
      "itemExamples": [
        "broken chairs",
        "rigid plastics",
        "plastic crates",
        "buckets"
      ],
      "offerType": "Pays ₹8/kg for broken plastic furniture and crates",
      "quantityAdvice": "Clean, unmixed plastic scrap yields the highest price.",
      "bulkGuide": "Caterers, event organizers, and furniture renters can dispose of broken items here.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Ahmedabad Granules Yard",
      "address": "Odhav GIDC, Ahmedabad, Gujarat 382415",
      "lat": 23.0189,
      "lng": 72.668,
      "phone": "+91 98251 33445",
      "rating": 4.4,
      "notes": "Accepts bulk clean industrial plastic film, stretch wraps, and bubble wrap.",
      "itemExamples": [
        "stretch wrap",
        "bubble wrap",
        "clean industrial plastic bags"
      ],
      "offerType": "Pays ₹7/kg for industrial transparent shrink wrap & packaging sheets",
      "quantityAdvice": "Material must be dust-free and dry.",
      "bulkGuide": "Logistics warehouses, courier yards, and factories.",
      "quantityFit": [
        "bulk"
      ]
    }
  ],
  "organic-food": [
    {
      "name": "Ahimsan Biogas Plant",
      "address": "SG Highway, Gota, Ahmedabad, Gujarat 382481",
      "lat": 23.1165276,
      "lng": 72.5342112,
      "phone": "+91 94290 12345",
      "rating": 4.6,
      "notes": "Converts hotel, banquet hall, and restaurant food waste to biogas. Offers cash incentives per kg of segregated wet waste.",
      "itemExamples": [
        "vegetable peels",
        "spoiled food",
        "kitchen scraps",
        "restaurant waste"
      ],
      "offerType": "Pays ₹2.00 per kg for food scraps / ₹1.50/kg for restaurant wet waste",
      "quantityAdvice": "Small quantities can be dropped at AMC sorting points; large hotels can schedule daily organic pickups.",
      "bulkGuide": "Hotels, restaurants, and food courts can establish contract collections for monthly payout.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "AMC Composting Facility",
      "address": "Gyaspur, Ahmedabad, Gujarat 380007",
      "lat": 22.9692992,
      "lng": 72.57833,
      "phone": "+91 79265 82600",
      "rating": 4.1,
      "notes": "Municipal composting center converting wet organic waste into high-quality agricultural compost.",
      "itemExamples": [
        "wet waste",
        "kitchen waste",
        "organic food scraps"
      ],
      "offerType": "Free municipal composting intake ( AMC Green Bin Program )",
      "quantityAdvice": "Suitable for daily household collection. Residents can deposit segregated green bins.",
      "bulkGuide": "Housing complexes can request AMC community compost bins for on-site management.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Vasna Compost & Composters",
      "address": "Vasna, Ahmedabad, Gujarat 380007",
      "lat": 23.0012,
      "lng": 72.5456,
      "phone": "+91 99256 77889",
      "rating": 4.3,
      "notes": "Organic scrap collection. Distributes organic compost to local nurseries and farms.",
      "itemExamples": [
        "vegetable skins",
        "green leaves",
        "coffee grounds",
        "eggshells"
      ],
      "offerType": "Pays ₹1.00 per kg for clean segregated raw kitchen peels",
      "quantityAdvice": "Strictly accepts only raw vegetable/fruit waste (no cooked food or oils).",
      "bulkGuide": "Vegetable vendors in local markets can sell daily waste here.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    }
  ],
  "agricultural": [
    {
      "name": "Gujarat Bio-Energy Pellet Corp",
      "address": "Sanand GIDC, Ahmedabad, Gujarat 382110",
      "lat": 22.9938803,
      "lng": 72.3834361,
      "phone": "+91 98251 98765",
      "rating": 4.7,
      "notes": "Buys crop residue, wheat straw, and cotton stalks directly from farmers to manufacture biomass pellets, reducing stubble burning.",
      "itemExamples": [
        "crop residue",
        "wheat straw",
        "stubble",
        "cotton stalks",
        "agricultural parali"
      ],
      "offerType": "Pays ₹2,200/ton for Rice Straw, ₹5,500/ton for Wheat Straw (Bhusa)",
      "quantityAdvice": "Best for trailer and tractor loads of straw and crop stubble.",
      "bulkGuide": "Farmer co-operatives and rural clusters can aggregate crop waste for high-volume contract sales.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Agro-Paper Pulp Industries",
      "address": "Kadi Industrial Area, Mehsana, Gujarat 382715",
      "lat": 23.3005019,
      "lng": 72.3284087,
      "phone": "+91 97241 12344",
      "rating": 4.4,
      "notes": "Utilizes agricultural straw, bagasse, and crop husks to produce biodegradable paper pulp and molded packaging. Weight-based cash payouts.",
      "itemExamples": [
        "bagasse",
        "crop straw",
        "husk",
        "wheat bhusa"
      ],
      "offerType": "Pays ₹1,800/ton for Sugarcane Bagasse, ₹5,000/ton for Wheat Straw",
      "quantityAdvice": "Best for commercial quantities; smaller household/farm lots can be coordinated.",
      "bulkGuide": "Sugar mills and agricultural cooperatives.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Sabarmati Straw Products",
      "address": "Vatva GIDC, Ahmedabad, Gujarat 382440",
      "lat": 22.961,
      "lng": 72.631,
      "phone": "+91 98250 88991",
      "rating": 4.2,
      "notes": "Straw board manufacturing plant. Buys crop residue, wheat straw, and rice husks for industrial boards.",
      "itemExamples": [
        "wheat straw",
        "rice husk",
        "crop residue"
      ],
      "offerType": "Pays ₹5,200/ton for Wheat Straw, ₹2,100/ton for Rice Straw",
      "quantityAdvice": "Requires material to be packed in clean dry bales.",
      "bulkGuide": "Local threshing units and farmer groups.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Ahmedabad Biomass Briquettes",
      "address": "Naroda Industrial Estate, Ahmedabad, Gujarat 382330",
      "lat": 23.0905,
      "lng": 72.671,
      "phone": "+91 97258 11445",
      "rating": 4.5,
      "notes": "Briquette plant pressing cotton stalks, mustard residue, and sawdust into solid boiler fuel briquettes.",
      "itemExamples": [
        "cotton stalks",
        "mustard stalks",
        "sawdust"
      ],
      "offerType": "Pays ₹3,200/ton for Cotton Stalks, ₹2,800/ton for Mustard Stalks",
      "quantityAdvice": "Materials must have less than 15% moisture content.",
      "bulkGuide": "Farmers clearing cotton fields after harvest can book direct field haulage.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Charotar Biomass Fuel",
      "address": "Bavla GIDC, Ahmedabad, Gujarat 382220",
      "lat": 22.8423,
      "lng": 72.3689,
      "phone": "+91 99241 55660",
      "rating": 4.3,
      "notes": "Activated carbon and pellet fuel manufacturer. Buys coconut shells, parali, and bagasse.",
      "itemExamples": [
        "coconut shells",
        "sugarcane bagasse",
        "rice parali"
      ],
      "offerType": "Pays ₹6,000/ton for Coconut Shells, ₹1,900/ton for Sugarcane Bagasse",
      "quantityAdvice": "Coconut shells are weighed and graded based on thickness.",
      "bulkGuide": "Coir extractors, temples, and agricultural markets.",
      "quantityFit": [
        "bulk"
      ]
    }
  ],
  "furniture": [
    {
      "name": "Ambika Wooden & Metal Scrap",
      "address": "Satellite Road, Shyamal, Ahmedabad, Gujarat 380015",
      "lat": 23.0123,
      "lng": 72.5298,
      "phone": "+91 89519 21781",
      "rating": 4.6,
      "notes": "Accepts wooden scrap, home furniture, beds, and tables with direct home pickup.",
      "itemExamples": [
        "wooden chair",
        "table",
        "wooden doors",
        "bed frame"
      ],
      "offerType": "Pays ₹150 – ₹500 for old chairs, ₹1,000 – ₹3,000 for wooden tables/sofas",
      "quantityAdvice": "Best for wooden beds, sofas, and solid timber doors.",
      "bulkGuide": "Arranges high-volume cargo trucks for society clearances.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Gujarat Furniture Salvage",
      "address": "Naroda GIDC, Ahmedabad, Gujarat 382330",
      "lat": 23.0789,
      "lng": 72.6512,
      "phone": "+91 97145 99001",
      "rating": 4.3,
      "notes": "Handles metal frame furniture, office desks, and bulk partition wood.",
      "itemExamples": [
        "metal sofa",
        "office desk",
        "steel cupboards"
      ],
      "offerType": "Pays ₹50/kg for metal frame furniture, ₹12/kg for scrap wood",
      "quantityAdvice": "Heavy metal furniture gets higher weight-based rates.",
      "bulkGuide": "Office renovations and shop closures can schedule corporate packing.",
      "quantityFit": [
        "bulk"
      ]
    },
    {
      "name": "Radhe Scrap Traders",
      "address": "Memnagar, Ahmedabad, Gujarat 380052",
      "lat": 23.0489,
      "lng": 72.5367,
      "phone": "+91 99457 31672",
      "rating": 4.4,
      "notes": "Specializes in household plastic furniture, PVC doors, and plastic tables.",
      "itemExamples": [
        "plastic chair",
        "plastic table",
        "pvc door"
      ],
      "offerType": "Pays ₹80 per plastic chair, ₹200 for plastic tables",
      "quantityAdvice": "Small plastic stools and chairs are accepted instantly.",
      "bulkGuide": "Banquet halls and catering hubs.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Ashok Furniture Buyers",
      "address": "Sabarmati, Ahmedabad, Gujarat 380005",
      "lat": 23.0785,
      "lng": 72.589,
      "phone": "+91 70464 69000",
      "rating": 4.2,
      "notes": "Accepts bulk office furniture, cubicle partitions, and wood scrap.",
      "itemExamples": [
        "office chair",
        "wooden desk",
        "partitions"
      ],
      "offerType": "Pays ₹300 per office chair, ₹1,500 per executive table",
      "quantityAdvice": "Corporate office chairs and tables can be dropped off directly.",
      "bulkGuide": "Corporate complexes and tech parks.",
      "quantityFit": [
        "bulk"
      ]
    }
  ],
  "trash": [
    {
      "name": "AMC Solid Waste Depot - Gyaspur",
      "address": "Gyaspur, Ahmedabad, Gujarat 380007",
      "lat": 22.965,
      "lng": 72.571,
      "phone": "+91 79265 82600",
      "rating": 4.0,
      "notes": "AMC Municipal Solid Waste Processing plant. Intake depot for non-recyclable city waste.",
      "itemExamples": [
        "mixed municipal waste",
        "non-recyclable trash"
      ],
      "offerType": "Free Municipal Disposal Intake (Landfill diversion sorting)",
      "quantityAdvice": "Requires segregated green and blue bags.",
      "bulkGuide": "Accepts bulk municipal waste deliveries from registered AMC waste contractors.",
      "quantityFit": [
        "single",
        "bulk"
      ]
    },
    {
      "name": "Swachh Transfer Station",
      "address": "Bopal, Ahmedabad, Gujarat 380058",
      "lat": 23.038,
      "lng": 72.482,
      "phone": "+91 79265 85000",
      "rating": 4.1,
      "notes": "AMC sub-station for garbage collection and compaction before transport to main dump.",
      "itemExamples": [
        "dry trash",
        "domestic waste"
      ],
      "offerType": "Free Intake for domestic municipal trash",
      "quantityAdvice": "Residents can drop off household waste for free.",
      "bulkGuide": "Commercial establishments can arrange daily trash disposal bins.",
      "quantityFit": [
        "single"
      ]
    }
  ]
};

Promise.all([
  fetch('dataset_summary.json', { cache: 'no-store' }).then(res => res.ok ? res.json() : null),
  fetch('waste_locations.json', { cache: 'no-store' }).then(res => {
    if (!res.ok) throw new Error('Could not load waste_locations.json');
    return res.json();
  })
])
  .then(([summary, data]) => {
    datasetSummary = summary || {};
    wasteData = {};
    const categoryOrder = Object.keys(categoryConfig);
    categoryOrder.forEach(key => {
      wasteData[key] = {
        color: categoryConfig[key].color,
        label: categoryConfig[key].label,
        places: data[key] || []
      };
    });
    activeCategory = 'e-waste';
    renderLocations(activeCategory);
  })
  .catch(err => {
    console.warn("Unable to load data files via fetch (CORS/offline). Using fallback embedded data.", err);
    datasetSummary = fallbackDatasetSummary;
    wasteData = {};
    const categoryOrder = Object.keys(categoryConfig);
    categoryOrder.forEach(key => {
      wasteData[key] = {
        color: categoryConfig[key].color,
        label: categoryConfig[key].label,
        places: fallbackWasteLocations[key] || []
      };
    });
    activeCategory = 'e-waste';
    renderLocations(activeCategory);
  });

function showResultsPanel() {
  const mainEl = document.querySelector('main');
  if (mainEl && mainEl.classList.contains('chat-only-mode')) {
    mainEl.classList.remove('chat-only-mode');
  }
  // On mobile viewports (<= 1000px), automatically open the map tab
  if (window.innerWidth <= 1000) {
    switchMobileTab('map');
  } else {
    const mapFrame = document.getElementById('mapFrame');
    if (mapFrame) {
      mapFrame.src = mapFrame.src;
    }
  }
}

function selectCategory(key, confidence) {
  smoothMoveToMessageSystem();
  activeCategory = key;
  renderLocations(key);
  const label = categoryConfig[key].label;
  const cleanLabel = label.split('(')[0].trim();
  speakText(`Showing centers for ${cleanLabel}`);
  
  // Sync dropdown value
  const selectEl = document.getElementById('chatCategorySelect');
  if (selectEl) selectEl.value = key;
}

 // Geolocation Request Trigger
function requestUserLocation() {
  smoothMoveToMessageSystem();
  const btn = document.getElementById('geoBtn');
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }
  btn.textContent = "📍 Fetching location...";
  navigator.geolocation.getCurrentPosition(
    (position) => {
      userCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      btn.textContent = "📍 Sorted by Nearest";
      btn.classList.add('active');
      renderLocations(activeCategory);
      
      addChatMessage('bot', `🤖 <strong>GPS Location Shared!</strong><br><br>Coordinates loaded. The recycler cards and map route are now sorted to display the closest centers first!`, null, true);
    },
    (error) => {
      console.error("Geolocation error:", error);
      btn.textContent = "📍 Location Error. Try again";
      alert("Could not fetch your location. Please ensure location permissions are enabled.");
    }
  );
}

// Haversine distance calculator
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function renderLocations(key) {
  const data = wasteData[key];
  const cardsEl = document.getElementById('cards');
  cardsEl.innerHTML = '';
  document.getElementById('listTitle').textContent = `Verified recyclers / intake centers — ${data?.label || key}`;

  if (!data || !data.places.length) {
    cardsEl.innerHTML = '<div class="empty-state">No verified locations logged for this category yet.</div>';
    mapFrame.src = 'https://www.google.com/maps?q=Ahmedabad%2C%20Gujarat&output=embed';
    return;
  }

  // Filter by quantity Fit
  let filteredPlaces = data.places.filter(place => {
    if (quantityMode === 'all') return true;
    return place.quantityFit && place.quantityFit.includes(quantityMode);
  });

  if (filteredPlaces.length === 0) {
    cardsEl.innerHTML = '<div class="empty-state">No recyclers fit this quantity criteria.</div>';
    mapFrame.src = 'https://www.google.com/maps?q=Ahmedabad%2C%20Gujarat&output=embed';
    return;
  }

  // Calculate distances and sort if coordinates exist
  if (userCoords) {
    filteredPlaces.forEach(place => {
      place.distance = calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng);
    });
    // Sort by distance
    filteredPlaces.sort((a, b) => a.distance - b.distance);
    
    // Filter to show only nearest (distance <= 8 km, or fall back to top 3 closest if all are further away)
    const withinRadius = filteredPlaces.filter(place => place.distance <= 8);
    if (withinRadius.length > 0) {
      filteredPlaces = withinRadius;
    } else {
      filteredPlaces = filteredPlaces.slice(0, 3);
    }
  }

  const firstPlace = filteredPlaces[0];
  const defaultMapQuery = `${firstPlace.name}, ${firstPlace.address}`;
  mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(defaultMapQuery)}&output=embed`;

  filteredPlaces.forEach((place, index) => {
    const distanceText = place.distance !== undefined ? `📍 ${place.distance.toFixed(1)} km away` : '';
    const card = document.createElement('div');
    card.className = 'loc-card';
    
    // Build items list
    let itemTags = '';
    if (place.itemExamples && place.itemExamples.length > 0) {
      itemTags = `<div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">` +
        place.itemExamples.map(item => `<span style="font-size: 9px; padding: 2px 6px; background: rgba(66, 114, 48, 0.05); border: 1px solid rgba(66, 114, 48, 0.1); border-radius: 4px; text-transform: capitalize; color: var(--moss-dark); font-weight: 500;">${item}</span>`).join('') +
        `</div>`;
    }
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
        <span style="font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; background: rgba(66, 114, 48, 0.08); color: var(--moss-dark); border: 1px solid rgba(66, 114, 48, 0.15); padding: 2px 8px; border-radius: 999px; display: inline-block;">
          🟢 Verified Intake
        </span>
        ${distanceText ? `<span style="font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: var(--rust);">${distanceText}</span>` : `<span style="font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: var(--rust);">★ ${place.rating}</span>`}
      </div>
      
      <div style="margin-top: 6px;">
        <h3 style="font-family: 'Oswald', sans-serif; font-size: 16px; color: var(--ink); margin-bottom: 2px; line-height: 1.2;">${place.name}</h3>
        <div style="font-size: 11px; color: var(--grey); line-height: 1.4; display: flex; align-items: flex-start; gap: 4px; margin-top: 4px;">
          <span style="flex-shrink: 0;">📍</span> <span>${place.address}</span>
        </div>
      </div>
      
      <div style="font-size: 11px; background: rgba(66, 114, 48, 0.03); border-left: 3px solid var(--moss); padding: 8px; border-radius: 0 8px 8px 0; margin-top: 6px;">
        <strong>Offer:</strong> ${place.offerType}<br>
        <span style="font-size: 10px; color: var(--grey); font-style: italic; display: inline-block; margin-top: 2px;">${place.notes}</span>
      </div>
      
      ${itemTags}
      
      <div style="display: flex; gap: 8px; margin-top: 10px; border-top: 1px dashed var(--line); padding-top: 10px; flex-wrap: wrap;">
        <a href="tel:${place.phone}" style="flex: 1; min-width: 110px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; color: white; background: var(--moss); border: none; padding: 8px; border-radius: 8px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s;">
          📞 Call Center
        </a>
        <button class="map-btn" data-index="${index}" style="flex: 1; min-width: 110px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; color: var(--moss-dark); background: white; border: 1px solid var(--moss); padding: 8px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; transition: all 0.15s;">
          🗺️ Open Route
        </button>
      </div>
    `;
    
    card.querySelector('.map-btn').addEventListener('click', () => {
      const query = `${place.name}, ${place.address}`;
      mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
    });
    cardsEl.appendChild(card);
  });
}

// Direct click trigger for uploader in welcome card if exists
if (dropzone) {
  dropzone.onclick = () => fileInput.click();
  
  // Drag and Drop listeners
  dropzone.ondragover = (e) => {
    e.preventDefault();
    dropzone.style.background = 'rgba(16, 185, 129, 0.08)';
    dropzone.style.borderColor = 'var(--moss-dark)';
  };
  dropzone.ondragleave = () => {
    dropzone.style.background = 'rgba(16, 185, 129, 0.025)';
    dropzone.style.borderColor = 'var(--moss)';
  };
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.background = 'rgba(16, 185, 129, 0.025)';
    dropzone.style.borderColor = 'var(--moss)';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      handleFileChange(fileInput);
    }
  };
}

function triggerChatUpload() {
  fileInput.click();
}

function handleInputKeydown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

function handleCategorySelectChange(value) {
  if (value === 'none') return;
  smoothMoveToMessageSystem();
  
  // Add user message bubble
  const label = categoryConfig[value]?.label || value;
  addChatMessage('user', label);
  
  setTimeout(() => {
    initiateCategoryRouting(value);
  }, 500);
}

function handleFileChange(input) {
  console.log("handleFileChange triggered. Files:", input.files);
  if (input.files && input.files.length > 0) {
    smoothMoveToMessageSystem();
    const file = input.files[0];
    console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      console.log("FileReader onload completed.");
      const originalDataUrl = e.target.result;
      
      const img = new Image();
      img.onload = () => {
        console.log("Offscreen Image loaded. Width:", img.width, "Height:", img.height);
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        
        console.log("Resized dimensions:", width, "x", height);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const downscaledDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        console.log("Downscaled data URL generated successfully.");
        
        addChatMessage('user', `Scanned this waste item:`, downscaledDataUrl);
        
        const typingId = showTypingIndicator();
        console.log("Typing indicator shown. typingId:", typingId);
        
        // Show loading status in the analyzing element
        const analyzingEl = document.getElementById('analyzing');
        if (analyzingEl) {
          analyzingEl.style.display = 'block';
          analyzingEl.textContent = '> Analyzing image with Edge AI...';
        }
        
        setTimeout(async () => {
          console.log("Starting classifyImage...");
          try {
            // Pass canvas directly for fastest, most reliable classification
            const result = await classifyImage(file, downscaledDataUrl, canvas);
            console.log("classifyImage result:", result);
            if (analyzingEl) analyzingEl.style.display = 'none';
            removeTypingIndicator(typingId);
            handleScannedWaste(result.category, result.confidence, result.reason, downscaledDataUrl, result.subtype, result.price);
          } catch (classifyErr) {
            console.error("Error inside classification runner:", classifyErr);
            if (analyzingEl) analyzingEl.style.display = 'none';
            removeTypingIndicator(typingId);
            addChatMessage('bot', '❌ Classification failed. Please try uploading again or choose a category from the dropdown.', null, true);
          }
        }, 800);
      };
      img.onerror = (imgErr) => {
        console.error("Image loading failed:", imgErr);
        const analyzingElErr = document.getElementById('analyzing');
        if (analyzingElErr) analyzingElErr.style.display = 'none';
        addChatMessage('bot', '❌ Sorry — the image failed to load. Please ensure it is a valid JPEG, PNG, or WebP file.');
      };
      img.src = originalDataUrl;
    };
    reader.onerror = (readErr) => {
      console.error("FileReader failed:", readErr);
    };
    reader.readAsDataURL(file);
  } else {
    console.warn("handleFileChange called, no files in input.");
  }
}

// Global Conversational States
let currentCategory = null;
let currentSubtype = null;
let currentQuantity = null;
let activeChipsCallback = null;

// Engaging Audience Waste Value Descriptions
const engagingDetails = {
  'e-waste': "Old laptops, phones, and chargers contain high-value metals like copper and gold. **Recyclers pay ₹200 – ₹1,500 per device**, and corporate bulk collections earn certified disposal payouts! 🔌💰 Turn your old electronics into extra income.",
  'glass': "Intact glass bottles can be returned to buyback centers for **₹1 – ₹2 per bottle**. Broken glass can be safely recycled to keep Gujarat clean! 🍾💵 Recycle responsibly and save landfill space.",
  'metal': "Metal scrap has the highest buyback rates! **Copper scrap fetches ₹450 – ₹550 / kg, aluminum cans ₹90 – ₹110 / kg, and iron scrap ₹22 – ₹28 / kg**. 🔩💰 Clean up your storeroom and get paid in cash instantly!",
  'paper-cardboard': "Clear out your storage and earn direct cash! **Newspapers (Pasti) sell for ₹12 – ₹16 / kg**, and corrugated cardboard boxes fetch **₹6 – ₹9 / kg**. 📦💵 Highly recyclable and instant buyback guaranteed.",
  'plastic': "Plastic waste has great value! **Clean PET bottles fetch ₹10 – ₹12 / kg**, while clean LDPE plastic bags earn **₹4 – ₹6 / kg**. 🥤💰 You can get paid direct cash by sending it to verified recyclers!",
  'organic-food': "Organic food waste is a valuable bio-resource! **Bulk kitchen scraps can be sold to biogas plants for ₹1.00 – ₹2.50 per kg**, or processed into organic compost fertilizer. 🍎💵 Turn your hotel or home kitchen waste into green energy!",
  'agricultural': "Save our air and earn money! Do not burn parali stubble. Bio-energy pellet plants buy **rice straw parali for ₹1,500 – ₹2,500 per metric ton**, and wheat straw bhusa for **₹4,000 – ₹6,000 per ton**. 🌾💰 We schedule direct field pickups.",
  'furniture': "Household furniture and wood scrap can be sold to recyclers for extra income! **Plastic chairs fetch ₹80 – ₹250 / piece, wooden desks buy back at ₹300 – ₹1,200 / piece, and wood scrap fetches ₹10 – ₹15 / kg**. 🪑💵 Clear out your old furniture and get paid instantly!",
  'trash': "Mixed trash has no direct cash payout, but safe recycling keeps Ahmedabad clean! 🗑️💚 AMC recycling stations handle landfill diversion for a greener tomorrow."
};

// Dynamic state logic when classification completes
function handleScannedWaste(category, confidence, reason, imageSrc, subtype, estimatedPrice) {
  currentCategory = category;
  currentSubtype = 'scanned';
  
  // Sync dropdown value
  const selectEl = document.getElementById('chatCategorySelect');
  if (selectEl) selectEl.value = category;
  
  const categoryLabel = categoryConfig[category].label;
  const highlightedCategory = `<div style="font-size: 32px; font-weight: 900; color: var(--moss-dark); margin: 16px 0 10px 0; display: inline-block; background: rgba(16, 185, 129, 0.08); padding: 8px 24px; border-radius: 14px; border: 2px solid rgba(16, 185, 129, 0.35); text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.05); font-family: 'Oswald', sans-serif;">✨ ${categoryLabel}</div>`;
  
  // Defaults fallback
  const finalSubtype = subtype || "General " + categoryLabel;
  const finalPrice = estimatedPrice || "Market Rates / Varies by weight";
  
  const detailsText = engagingDetails[category] || '';
  
  const combinedMsg = `🤖 I've identified your uploaded item as:<br>${highlightedCategory}
    <div style="background: rgba(16, 185, 129, 0.04); border-left: 4px solid var(--moss); padding: 12px; border-radius: 8px; margin-top: 14px; font-size: 13.5px; line-height: 1.5; color: var(--ink);">
      <strong>🔍 Identified Item:</strong> ${finalSubtype}<br>
      <strong>💰 Est. Buyback Value:</strong> <span style="font-weight: 700; color: var(--moss-dark);">${finalPrice}</span>
    </div>
    <p style="margin-top: 12px; font-size: 13.5px; line-height: 1.6; color: var(--ink);">${detailsText}</p>
    <div style="margin-top: 20px;">
      <h4 style="font-family: 'Oswald', sans-serif; font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Specify Quantity:</h4>
      <p style="font-size: 13.5px; color: var(--grey); margin: 0; line-height: 1.5;">How much waste do you want to dispose of? This helps filter matching buyers and transport options:</p>
    </div>`;

  activeChipsCallback = handleQuantityChoice;
  addChatMessage('bot', combinedMsg, null, true, [
    { text: '🛒 Small Quantity (Household / 1-2 items)', value: 'single' },
    { text: '🚛 Large / Bulk Quantity (Commercial / Multi-item)', value: 'bulk' }
  ]);
}

function initiateCategoryRouting(category) {
  smoothMoveToMessageSystem();
  currentCategory = category;
  currentSubtype = null;
  currentQuantity = null;

  // Make sure we are in chat-only-mode first (full screen chat)
  const mainEl = document.querySelector('main');
  if (mainEl && !mainEl.classList.contains('chat-only-mode')) {
    mainEl.classList.add('chat-only-mode');
  }

  const categoryLabel = categoryConfig[category].label;
  const detailsText = engagingDetails[category] || '';
  const highlightedCategory = `<div style="font-size: 32px; font-weight: 900; color: var(--moss-dark); margin: 16px 0 10px 0; display: inline-block; background: rgba(16, 185, 129, 0.08); padding: 8px 24px; border-radius: 14px; border: 2px solid rgba(16, 185, 129, 0.35); text-align: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.05); font-family: 'Oswald', sans-serif;">✨ ${categoryLabel}</div>`;

  const promptText = `🤖 ${highlightedCategory}
    <p style="margin-top: 8px; font-size: 13.5px; line-height: 1.6; color: var(--ink);">${detailsText}</p>
    <div style="margin-top: 16px;">
      <h4 style="font-family: 'Oswald', sans-serif; font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 4px; text-transform: uppercase;">Provide Details:</h4>
      <p style="font-size: 13px; color: var(--grey); margin: 0; line-height: 1.5;">Please upload an image of the item using the camera icon 📷 below. If you don't have an image, please specify what type you have:</p>
    </div>`;

  let chips = [];
  if (category === 'e-waste') {
    chips = [
      { text: '📱 Small Electronics (Phone/Laptop/Gadgets)', value: 'single' },
      { text: '🏢 Large Appliances (Fridge/Washing Machine/TV)', value: 'bulk' }
    ];
  } 
  else if (category === 'glass') {
    chips = [
      { text: '🍾 Intact Bottles / Glass Containers', value: 'intact' },
      { text: '🍷 Broken Glass / Scrap Shards', value: 'broken' }
    ];
  }
  else if (category === 'paper-cardboard') {
    chips = [
      { text: '📦 Corrugated Cardboard Boxes', value: 'cardboard' },
      { text: '📰 Pasti / Old Newspapers / Documents', value: 'paper' }
    ];
  }
  else if (category === 'organic-food') {
    chips = [
      { text: '🏡 Household Kitchen Scraps', value: 'house' },
      { text: '🏨 Commercial (Hotel/Restaurant/Banquet)', value: 'commercial' }
    ];
  }
  else if (category === 'agricultural') {
    chips = [
      { text: '🌾 Rice Straw / Parali (Pellet Fuel)', value: 'rice' },
      { text: '🌾 Wheat Straw / Bhusa (Cattle Feed / Pulp)', value: 'wheat' },
      { text: '🪵 Cotton Stalks (Biomass Briquettes)', value: 'cotton' },
      { text: '🌿 Mustard Stalks (Industrial Fuel)', value: 'mustard' },
      { text: '🥥 Coconut Shells & Coir (Activated Carbon)', value: 'coconut' },
      { text: '🎋 Sugarcane Bagasse (Pulp / Bio-energy)', value: 'bagasse' }
    ];
  }
  else if (category === 'metal') {
    chips = [
      { text: '🔩 Ferrous Metals (Iron / Steel)', value: 'ferrous' },
      { text: '⚡ Non-Ferrous (Copper / Brass / Aluminum)', value: 'nonferrous' }
    ];
  }
  else if (category === 'furniture') {
    chips = [
      { text: '🪑 Wooden Chairs / Stools', value: 'chair' },
      { text: '🪵 Scrap Wood / Plywood Sheets', value: 'wood' },
      { text: '🛋️ Sofas / Large Wooden Couches', value: 'sofa' },
      { text: '🛌 Wooden Bed / Wardrobes', value: 'bed' },
      { text: '🏫 Tables / Desks', value: 'table' }
    ];
  }
  else {
    askQuantityQuestion();
    return;
  }

  activeChipsCallback = handleSubtypeChoice;
  addChatMessage('bot', promptText, null, true, chips);
}

function handleSubtypeChoice(value) {
  currentSubtype = value;
  // Proceed to ask quantity
  setTimeout(() => {
    askQuantityQuestion();
  }, 600);
}

// Question for quantity
function askQuantityQuestion() {
  let botMsg = `🤖 <strong>Specify Quantity:</strong><br><br>How much waste do you want to dispose of? This helps filter matching buyers and transport options:`;
  activeChipsCallback = handleQuantityChoice;
  addChatMessage('bot', botMsg, null, true, [
    { text: '🛒 Small Quantity (Household / 1-2 items)', value: 'single' },
    { text: '🚛 Large / Bulk Quantity (Commercial / Multi-item)', value: 'bulk' }
  ]);
}

function handleQuantityChoice(value) {
  currentQuantity = value;
  quantityMode = value;
  const selectEl = document.getElementById('quantitySelect');
  if (selectEl) selectEl.value = value;
  
  // Now reveal results
  setTimeout(() => {
    revealResults();
  }, 600);
}

function compileMatchedLocationsText() {
  if (!currentCategory || !wasteData[currentCategory]) {
    return "No matching centers found.";
  }
  const places = wasteData[currentCategory].places || [];
  const filtered = places.filter(place => {
    if (currentQuantity === 'all') return true;
    return place.quantityFit && place.quantityFit.includes(currentQuantity);
  });
  
  if (filtered.length === 0) {
    return "No centers fit this quantity criteria. Please try changing your quantity filter.";
  }
  
  let html = `
    <p>Here are the verified recycling centers matching your request:</p>
    <div style="overflow-x: auto; margin-top: 12px; border: 1px solid var(--line); border-radius: 8px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; background: white;">
        <thead>
          <tr style="background: rgba(16, 185, 129, 0.05); border-bottom: 1px solid var(--line);">
            <th style="padding: 10px; font-weight: 600; color: var(--ink);">Dealer</th>
            <th style="padding: 10px; font-weight: 600; color: var(--ink);">Contact</th>
            <th style="padding: 10px; font-weight: 600; color: var(--ink);">Area</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  filtered.forEach(p => {
    // Extract simple area/neighborhood from address
    const area = p.address.split(',')[0].trim();
    html += `
          <tr style="border-bottom: 1px solid rgba(0, 0, 0, 0.03);">
            <td style="padding: 10px; font-weight: 600; color: var(--ink);">
              ${p.name}
              ${p.notes ? `<br><span style="font-size: 10px; font-weight: normal; color: var(--grey); font-style: italic;">(${p.notes})</span>` : ''}
            </td>
            <td style="padding: 10px;">
              <a href="tel:${p.phone}" style="color: var(--moss-dark); font-weight: 600; text-decoration: underline;">${p.phone}</a>
            </td>
            <td style="padding: 10px; color: var(--grey);">${area}</td>
          </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  return html;
}

function revealResults() {
  // 1. Expand split-screen panel
  showResultsPanel();
  
  // 2. Load locations and focus map
  selectCategory(currentCategory, null);
  
  // 3. Compile location list and reply
  const locationsListText = compileMatchedLocationsText();
  const botResponse = `🤖 <strong>Matching Buyers Located!</strong><br><br>${locationsListText}The map and directions are now ready on the right side of the screen.`;
  
  const msgId = addChatMessage('bot', botResponse, null, true);
  speakTextAfterDelay(msgId);
}

window.handleChipClick = (value, btnEl) => {
  const selectedText = btnEl.querySelector('span').textContent;
  const wrapper = btnEl.closest('.choice-chips-inner-wrapper');
  if (wrapper) wrapper.remove();
  addChatMessage('user', selectedText);
  if (activeChipsCallback) {
    const cb = activeChipsCallback;
    activeChipsCallback = null;
    cb(value);
  }
};

// TensorFlow Edge AI categorization mapping
function mapMobileNetToWaste(predictions) {
  console.debug('MobileNet Predictions:', predictions);

  if (!predictions || predictions.length === 0) {
    return { category: 'trash', confidence: 50, label: 'Mixed Trash', matchedKeyword: 'default', className: 'unknown object' };
  }

  // Fast-path exact ImageNet class checks for ultimate accuracy
  const topPred = predictions[0];
  const topClass = (topPred.className || '').toLowerCase();
  
  // 1. Glass Fast-Path (beer, wine, and pop/glass bottles)
  if (topClass.includes('wine bottle') || 
      topClass.includes('beer bottle') || 
      topClass.includes('glass bottle') || 
      topClass.includes('demijohn') || 
      topClass.includes('goblet') || 
      topClass.includes('decanter') || 
      topClass.includes('flask') ||
      topClass.includes('beaker') ||
      topClass.includes('chalice')) {
    return { category: 'glass', label: 'Glass', confidence: Math.round((topPred.probability || 0.95) * 100), matchedKeyword: 'glass bottle/vessel', className: topPred.className };
  }

  // 2. Plastic Fast-Path
  if (topClass.includes('water bottle') || 
      topClass.includes('pill bottle') || 
      topClass.includes('plastic bag') || 
      topClass.includes('soap dispenser') || 
      topClass.includes('hair spray') ||
      topClass.includes('shampoo bottle')) {
    return { category: 'plastic', label: 'Plastic', confidence: Math.round((topPred.probability || 0.92) * 100), matchedKeyword: 'plastic bottle/bag', className: topPred.className };
  }
  
  // 3. E-Waste Fast-Path
  if (topClass.includes('keyboard') || 
      topClass.includes('mouse') || 
      topClass.includes('computer') || 
      topClass.includes('laptop') || 
      topClass.includes('cellular telephone') || 
      topClass.includes('mobile phone') || 
      topClass.includes('television') || 
      topClass.includes('monitor') || 
      topClass.includes('printer') || 
      topClass.includes('joystick') || 
      topClass.includes('modem') || 
      topClass.includes('router') || 
      topClass.includes('hard disc')) {
    return { category: 'e-waste', label: 'E-Waste', confidence: Math.round((topPred.probability || 0.95) * 100), matchedKeyword: 'device/peripheral', className: topPred.className };
  }

  // 4. Furniture Fast-Path
  if (topClass.includes('chair') || 
      topClass.includes('desk') || 
      topClass.includes('table') || 
      topClass.includes('sofa') || 
      topClass.includes('couch') || 
      topClass.includes('bed') || 
      topClass.includes('cabinet') || 
      topClass.includes('bookcase') || 
      topClass.includes('cupboard') || 
      topClass.includes('stool')) {
    return { category: 'furniture', label: 'Wood & Furniture', confidence: Math.round((topPred.probability || 0.90) * 100), matchedKeyword: 'household furniture', className: topPred.className };
  }

  const categoryMapping = [
    { category: 'e-waste', label: 'E-Waste', keywords: ['keyboard','mouse','computer','laptop','screen','monitor','cellular','phone','ipod','television','printer','joystick','modem','router','cpu','electronic','battery','cable','wire','adapter','charger','headphone','plug','remote control','modem','projector','speaker','webcam','microphone','oscilloscope','tester','lighter','lipstick','pill bottle','matchstick','candle','projectile'] },
    { category: 'glass', label: 'Glass', keywords: ['glass','beaker','jar','goblet','decanter','vial','lens','mirror','chalice','flute','mug','vessel'] },
    { category: 'metal', label: 'Metal', keywords: ['can','tin','brass','bronze','aluminum','metal','steel','iron','screw','nail','utensil','pot','pan','kettle','foil','wire','cable','hardware','sheet','pipe','rod','tool','alloy','plate','wrench','bolt','nut','white','white goods','washer','anvil','automotive','machine','key','lock','pipe','hook','safety pin','staple','paperclip','needle','wire'] },
    { category: 'paper-cardboard', label: 'Paper / Cardboard', keywords: ['cardboard','box','carton','paper','envelope','book','newspaper','notebook','magazine','binder','card','packet','wrapper','leaflet','flyer','napkin','tissue'] },
    { category: 'plastic', label: 'Plastic', keywords: ['plastic','bottle','cup','tub','container','jug','wrapper','polybag','bag','sachet','tray','film','cellophane','bucket','crate','beaker'] },
    { category: 'organic-food', label: 'Food Waste', keywords: ['banana','apple','orange','bread','food','vegetable','fruit','compost','kitchen','leftovers','peel','scraps','meat','egg','cabbage','potato','tomato','onion','corn','strawberry','lemon','mushroom','eggplant','broccoli','salad','pizza','cookie','doughnut','soup'] },
    { category: 'agricultural', label: 'Agro Waste / Stubble', keywords: ['hay','straw','stubble','corn','stalk','plant','crop','wheat','husk','parali','agri','farm','field','bagasse','sugarcane','coconut','coir','mustard','cotton','paddy','soil','vegetation','leaf','leaves','bamboo','wood','foliage','bark','grass','shrub','haystack','thatch'] },
    { category: 'furniture', label: 'Wood & Furniture', keywords: ['chair','table','desk','sofa','couch','bed','cabinet','bookcase','cupboard','dresser','wardrobe','bench','stool','cradle','crib','wood','timber','plywood','furniture','cabinet'] },
    { category: 'trash', label: 'Trash / Mixed Waste', keywords: ['trash','garbage','waste','diaper','napkin','dust','rubbish','refuse'] }
  ];

  // score categories by summing probabilities of matching keywords across top predictions
  const scores = {};
  categoryMapping.forEach(m => scores[m.category] = 0);

  predictions.slice(0, 6).forEach(pred => {
    const className = (pred.className || '').toLowerCase();
    const p = pred.probability || 0;

    categoryMapping.forEach(mapping => {
      mapping.keywords.forEach(kw => {
        if (className.includes(kw)) {
          scores[mapping.category] += p;
        }
      });
    });
  });

  // find best category
  let best = { category: 'trash', score: 0 };
  Object.keys(scores).forEach(cat => {
    if (scores[cat] > best.score) best = { category: cat, score: scores[cat] };
  });

  if (best.score > 0) {
    const confidence = Math.min(99, Math.round(best.score * 100));
    const mapping = categoryMapping.find(m => m.category === best.category);
    // find matched keyword for reason
    let matched = '';
    for (const pred of predictions.slice(0,6)) {
      const cn = pred.className.toLowerCase();
      for (const kw of mapping.keywords) {
        if (cn.includes(kw)) { matched = kw; break; }
      }
      if (matched) break;
    }
    return { category: mapping.category, label: mapping.label, confidence: confidence, matchedKeyword: matched || topClass, className: topPred.className };
  }

  // fallback: use top prediction probability
  const fallbackConfidence = Math.round((topPred.probability || 0) * 100);
  // if topPrediction contains 'bottle' prefer plastic
  if (topClass.toLowerCase().includes('bottle')) {
    return { category: 'plastic', label: 'Plastic', confidence: fallbackConfidence, matchedKeyword: 'bottle', className: topPred.className };
  }

  return { category: 'trash', label: 'Trash / Mixed Waste', confidence: fallbackConfidence, matchedKeyword: topClass, className: topPred.className };
}

// Developer AI Configurations (Enter your Google AI Studio Gemini API Key here)
const GEMINI_API_KEY = "AQ.Ab8RN6IMMpxAI0W2zmcwtsCd0cg7pEIgLfUdSY1ZQ8QImrERig"; 

// Voice Assistant Settings & Globals
let speechEnabled = true;
let recognition = null;
let isListening = false;
let welcomeSpoken = false;
let msgCounter = 0;

// Google Gemini API Handlers
async function callGeminiVision(base64DataUrl) {
  const key = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!key) return null;
  
  const commaIdx = base64DataUrl.indexOf(',');
  const mimeType = base64DataUrl.substring(5, base64DataUrl.indexOf(';'));
  const base64Data = base64DataUrl.substring(commaIdx + 1);
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  
  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Analyze this waste item image. Determine which waste category it belongs to out of these exact names: 'e-waste', 'glass', 'metal', 'paper-cardboard', 'plastic', 'organic-food', 'agricultural', 'furniture', 'trash'. Identify the specific sub-type of the item in detail (e.g. 'Newspaper', 'Cardboard Box', 'Mobile Phone', 'Car Battery', 'Washing Machine', 'Plastic Chair', 'Wood Scrap', etc.) and determine a typical buyback price range for this item in the Indian scrap market. Provide the output as a valid JSON object only (no markdown wrapper) matching this format: {\"category\": \"exact_category_name\", \"label\": \"Display Name\", \"confidence\": 98, \"subtype\": \"Identified Sub-type\", \"price\": \"₹XX - ₹XX per unit or kg\", \"reason\": \"A detailed paragraph explaining the item, its value, and how it can be recycled.\"}"
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.trim());
}

async function callGeminiText(prompt) {
  const key = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  if (!key) return null;
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  
  const systemPrompt = `You are Punarchakra AI, a premium waste router assistant for the Maverick Effect Challenge in Gujarat/India.
Your goal is to answer user waste queries with detailed, professional, structured information.
Always categorize the query into one of: 'e-waste', 'glass', 'metal', 'paper-cardboard', 'plastic', 'organic-food', 'agricultural', 'furniture', 'trash'.
Structure your response in beautiful Markdown:
1. Recyclability & Hazard Rating: 🟢 Green (Safe / Value), 🟡 Yellow (Needs Care), 🔴 Red (Hazardous)
2. Estimated Buyback Value: Highlight typical prices per kg or unit (e.g. Copper ₹500/kg, Cardboard ₹8/kg, PET bottles ₹10/kg, Plastic Chair ₹80/pc, Wood ₹12/kg).
3. Handling Instructions: Step-by-step guidance.
4. Recommendation: Recommend the user check the right panel, where you will automatically sort and display the nearest centers.

At the very end of your response, on a new line, add: [Category: furniture] (or the appropriate category name out of the exact list: e-waste, glass, metal, paper-cardboard, plastic, organic-food, agricultural, furniture, trash). This tag is required for the UI routing.

Be conversational, professional, and encouraging. Keep answers concise but comprehensive.`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: systemPrompt
        }
      ]
    }
  };
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Voice Toggle Handler
function toggleVoiceSpeech() {
  speechEnabled = !speechEnabled;
  const mainBtn = document.getElementById('voiceToggleBtn');
  const btnText = document.getElementById('voiceBtnText');
  
  if (speechEnabled) {
    if (mainBtn) mainBtn.classList.remove('muted');
    if (btnText) btnText.textContent = 'Voice On';
    speakText("Speech synthesis unmuted.");
  } else {
    if (mainBtn) {
      mainBtn.textContent = '🔇 Voice Off';
      mainBtn.classList.add('muted');
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// Web Speech API Voice Synthesis (Voice Output)
// BUGFIX: voices list loads asynchronously in Chrome - must wait for it, not read it immediately
let voicesReady = false;
let cachedVoices = [];

function loadVoicesOnce() {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      voicesReady = true;
      resolve(voices);
      return;
    }
    
    // Fallback timer so we never hang if onvoiceschanged doesn't fire
    const timer = setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 450);

    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      cachedVoices = window.speechSynthesis.getVoices();
      voicesReady = true;
      resolve(cachedVoices);
    };
  });
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  loadVoicesOnce();
}

async function speakText(text) {
  if (!speechEnabled) return;
  if (!('speechSynthesis' in window)) return;

  if (!voicesReady) {
    await loadVoicesOnce();
  }

  window.speechSynthesis.cancel();

  const cleanText = text.replace(/<[^>]*>/g, '')
    .replace(/🤖|👋|📍|📞|★|🗑️|🥤|📰|🔌|🍾|🔬|🌿|🌾|🏨|🏡|🏢|📱/g, '')
    .replace(/\*/g, '')
    .trim();

  const speakLimitText = cleanText.length > 250 ? cleanText.substring(0, 250) + "..." : cleanText;
  const utterance = new SpeechSynthesisUtterance(speakLimitText);

  let langCode = getSpeechLangCode();
  const target = langCode.toLowerCase().split('-')[0];

  let targetVoice = null;
  if (cachedVoices && cachedVoices.length > 0) {
    targetVoice = cachedVoices.find(v => {
      const voiceLang = v.lang.toLowerCase();
      const voiceName = v.name.toLowerCase();
      return voiceLang.startsWith(target) ||
             voiceLang.includes(target + '_') ||
             voiceName.includes(target === 'gu' ? 'gujarati' : target === 'hi' ? 'hindi' : target === 'mr' ? 'marathi' : target === 'ta' ? 'tamil' : target === 'te' ? 'telugu' : 'english');
    });
  }

  if (langCode.startsWith('gu') && !targetVoice && cachedVoices && cachedVoices.length > 0) {
    console.warn("No Gujarati voice available on this device — falling back to Hindi");
    langCode = 'hi-IN';
    targetVoice = cachedVoices.find(v => {
      const voiceLang = v.lang.toLowerCase();
      const voiceName = v.name.toLowerCase();
      return voiceLang.startsWith('hi') || voiceLang.includes('hi_') || voiceName.includes('hindi');
    });
  }

  utterance.lang = langCode;
  if (targetVoice) {
    utterance.voice = targetVoice;
  }
  
  // Slower speech rate for regional languages for better clarity
  utterance.rate = langCode.startsWith('en') ? 1.0 : 0.85;

  window.speechSynthesis.speak(utterance);
}

function getSpeechLangCode() {
  let currentLang = document.getElementById('customLangSelect')?.value || 'en';
  
  // Fallback to active Google Translate selection if custom select is English
  if (currentLang === 'en') {
    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo && googleCombo.value) {
      currentLang = googleCombo.value;
    }
  }
  
  const mapping = {
    'en': 'en-US',
    'hi': 'hi-IN',
    'gu': 'gu-IN',
    'mr': 'mr-IN',
    'ta': 'ta-IN',
    'te': 'te-IN'
  };
  return mapping[currentLang] || 'en-US';
}

function speakWelcome() {
  speakText("Namaste! Welcome to Punarchakra AI. How can I help you today?");
}

function speakTextAfterDelay(messageElementId) {
  const currentLang = document.getElementById('customLangSelect')?.value || 'en';
  const delay = currentLang === 'en' ? 350 : 1500; // 1.5 seconds delay for Google Translate to complete
  setTimeout(() => {
    const el = document.getElementById(messageElementId);
    if (el) {
      const bubble = el.querySelector('.bubble');
      if (bubble) {
        speakText(bubble.innerText || bubble.textContent);
      }
    }
  }, delay);
}

// Web Speech API Voice Recognition (Voice Input)
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return;
  
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  
  recognition.onstart = () => {
    isListening = true;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
      micBtn.innerHTML = '🛑';
      micBtn.style.background = 'var(--rust)';
      micBtn.style.color = 'white';
    }
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = "Listening...";
  };
  
  recognition.onend = () => {
    isListening = false;
    const micBtn = document.getElementById('micBtn');
    if (micBtn) {
      micBtn.innerHTML = '🎙️';
      micBtn.style.background = 'transparent';
      micBtn.style.color = 'var(--grey)';
    }
    const chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = "Ask Punarchakra AI a question...";
  };
  
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript;
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = text;
      sendChatMessage();
    }
  };
  
  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.placeholder = `Voice error: ${event.error}`;
      setTimeout(() => {
        chatInput.placeholder = "Ask Punarchakra AI a question...";
      }, 1800);
    }
  };
}

function toggleVoiceInput() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    alert("Speech recognition is not supported in this browser. Try Google Chrome or Microsoft Edge.");
    return;
  }

  if (!recognition) {
    initSpeechRecognition();
  }

  if (!recognition) {
    return;
  }

  if (isListening) {
    recognition.stop();
  } else {
    try {
      recognition.lang = getSpeechLangCode();
      recognition.start();
    } catch (err) {
      console.error("Could not start speech recognition:", err);
      alert("Voice input could not be started. Please try again.");
    }
  }
}

// Classification Pipeline
async function classifyImage(file, dataUrl, canvasElement = null) {
  const apiKey = GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
  
  if (apiKey) {
    try {
      const analyzing = document.getElementById('analyzing');
      if (analyzing) {
         analyzing.style.display = 'block';
         analyzing.textContent = '> Calling Gemini Vision AI...';
      }
      const geminiResult = await callGeminiVision(dataUrl);
      if (analyzing) analyzing.style.display = 'none';
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.error("Gemini Vision failed, falling back to local:", err);
      const analyzing = document.getElementById('analyzing');
      if (analyzing) analyzing.textContent = '> Gemini error. Using Edge AI...';
    }
  }

  // Filename fast-path keyword check
  const lowerName = (file && file.name) ? file.name.toLowerCase() : '';
  const keywordRules = [
    { keywords: ['battery', 'elect', 'phone', 'chip', 'circuit', 'laptop', 'tv', 'monitor', 'wire', 'cable', 'adapter', 'charger', 'gadget'], category: 'e-waste', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['glass', 'bottle', 'jar', 'mirror', 'beaker', 'lens'], category: 'glass', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['metal', 'scrap', 'iron', 'steel', 'aluminum', 'copper', 'brass', 'bronze', 'pipe', 'screw', 'nail', 'utensil', 'key', 'lock', 'can', 'foil', 'tool', 'bhangar'], category: 'metal', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['paper', 'cardboard', 'box', 'book', 'newspaper', 'carton', 'pasti', 'envelope', 'magazine'], category: 'paper-cardboard', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['plastic', 'pack', 'poly', 'container', 'bottle', 'sachet', 'wrapper', 'bag'], category: 'plastic', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['food', 'banana', 'vegetable', 'kitchen', 'peel', 'apple', 'scrap', 'leftover', 'organic'], category: 'organic-food', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['stubble', 'straw', 'crop', 'husk', 'parali', 'agricultural', 'agri', 'farm', 'wheat', 'rice', 'cotton', 'mustard', 'coconut', 'coir', 'bagasse', 'sugarcane', 'hay', 'bhusa', 'stalk'], category: 'agricultural', confidence: 95.0, reason: 'Matched filename keyword.' },
    { keywords: ['chair', 'table', 'sofa', 'desk', 'bed', 'stool', 'furniture', 'cupboard', 'cabinet', 'wood', 'timber', 'plywood'], category: 'furniture', confidence: 95.0, reason: 'Matched filename keyword.' }
  ];

  if (lowerName) {
    for (const rule of keywordRules) {
      if (rule.keywords.some(keyword => lowerName.includes(keyword))) {
        const subDetails = getSubtypeAndPriceFromClassName(lowerName, rule.category);
        return {
          category: rule.category,
          confidence: rule.confidence,
          label: categoryConfig[rule.category].label,
          subtype: subDetails.subtype,
          price: subDetails.price,
          reason: `Local fast-path check: detected keyword in filename ("${lowerName}").`
        };
      }
    }
  }

  if (isModelLoading) {
    // wait for model to finish loading (up to ~5s)
    let waited = 0;
    while (isModelLoading && waited < 20) {
      await new Promise(r => setTimeout(r, 250));
      waited++;
    }
  }

  if (!classifierModel) {
    return mockClassifyImage(file);
  }

  // If canvasElement is available, classify it directly to avoid image loading delays/bugs
  if (canvasElement) {
    try {
      console.log("Classifying directly from canvas element...");
      const predictions = await classifierModel.classify(canvasElement);
      const mappingResult = mapMobileNetToWaste(predictions);
      const subDetails = getSubtypeAndPriceFromClassName(mappingResult.className, mappingResult.category);
      return {
        category: mappingResult.category,
        confidence: mappingResult.confidence,
        label: mappingResult.label,
        subtype: subDetails.subtype,
        price: subDetails.price,
        reason: `Detected: "${mappingResult.className}" (matched: "${mappingResult.matchedKeyword}").`
      };
    } catch (canvasErr) {
      console.error("MobileNet direct canvas classification error, falling back to image:", canvasErr);
    }
  }

  return new Promise(resolve => {
    // 10-second safety timeout (WebGL can take a few seconds on first run)
    const timeoutId = setTimeout(() => {
      console.warn("Classification timed out. Falling back to mock classification.");
      resolve(mockClassifyImage(file));
    }, 10000);

    const img = new Image();
    img.onload = async () => {
      try {
        const predictions = await classifierModel.classify(img);
        clearTimeout(timeoutId);
        const mappingResult = mapMobileNetToWaste(predictions);
        const subDetails = getSubtypeAndPriceFromClassName(mappingResult.className, mappingResult.category);
        resolve({
          category: mappingResult.category,
          confidence: mappingResult.confidence,
          label: mappingResult.label,
          subtype: subDetails.subtype,
          price: subDetails.price,
          reason: `Detected: "${mappingResult.className}" (matched: "${mappingResult.matchedKeyword}").`
        });
      } catch (err) {
        console.error('MobileNet error:', err);
        clearTimeout(timeoutId);
        resolve(mockClassifyImage(file));
      }
    };
    img.onerror = () => {
      clearTimeout(timeoutId);
      resolve(mockClassifyImage(file));
    };
    img.src = dataUrl;
  });
}

function mockClassifyImage(file) {
  const lowerName = (file && file.name) ? file.name.toLowerCase() : '';
  const keywordRules = [
    { keywords: ['battery', 'elect', 'phone', 'chip', 'circuit', 'laptop', 'tv', 'monitor', 'wire', 'cable', 'adapter', 'charger', 'gadget'], category: 'e-waste', confidence: 92.6, reason: 'Matched filename keyword.' },
    { keywords: ['glass', 'bottle', 'jar', 'mirror', 'beaker', 'lens'], category: 'glass', confidence: 89.4, reason: 'Matched filename keyword.' },
    { keywords: ['metal', 'scrap', 'iron', 'steel', 'aluminum', 'copper', 'brass', 'bronze', 'pipe', 'screw', 'nail', 'utensil', 'key', 'lock', 'can', 'foil', 'tool', 'bhangar'], category: 'metal', confidence: 91.8, reason: 'Matched filename keyword.' },
    { keywords: ['paper', 'cardboard', 'box', 'book', 'newspaper', 'carton', 'pasti', 'envelope', 'magazine'], category: 'paper-cardboard', confidence: 88.8, reason: 'Matched filename keyword.' },
    { keywords: ['plastic', 'pack', 'poly', 'container', 'bottle', 'sachet', 'wrapper', 'bag'], category: 'plastic', confidence: 90.2, reason: 'Matched filename keyword.' },
    { keywords: ['food', 'banana', 'vegetable', 'kitchen', 'peel', 'apple', 'scrap', 'leftover', 'organic'], category: 'organic-food', confidence: 93.4, reason: 'Matched filename keyword.' },
    { keywords: ['stubble', 'straw', 'crop', 'husk', 'parali', 'agricultural', 'agri', 'farm', 'wheat', 'rice', 'cotton', 'mustard', 'coconut', 'coir', 'bagasse', 'sugarcane', 'hay', 'bhusa', 'stalk'], category: 'agricultural', confidence: 95.1, reason: 'Matched filename keyword.' },
    { keywords: ['chair', 'table', 'sofa', 'desk', 'bed', 'stool', 'furniture', 'cupboard', 'cabinet', 'wood', 'timber', 'plywood'], category: 'furniture', confidence: 91.5, reason: 'Matched filename keyword.' }
  ];

  if (lowerName) {
    for (const rule of keywordRules) {
      if (rule.keywords.some(keyword => lowerName.includes(keyword))) {
        const subDetails = getSubtypeAndPriceFromClassName(lowerName, rule.category);
        return { category: rule.category, confidence: rule.confidence, label: categoryConfig[rule.category].label, subtype: subDetails.subtype, price: subDetails.price, reason: rule.reason };
      }
    }
  }

  const defaultSubDetails = getSubtypeAndPriceFromClassName("unknown", "trash");
  return { category: 'trash', confidence: 72.5, label: 'Trash / Mixed Waste', subtype: defaultSubDetails.subtype, price: defaultSubDetails.price, reason: 'Default fallback (detected as mixed waste).' };
}

function getSubtypeAndPriceFromClassName(className, category) {
  const cn = className.toLowerCase();
  
  // Defaults by category
  let subtype = "General " + categoryConfig[category].label;
  let price = "Varies by weight";
  
  if (category === 'e-waste') {
    if (cn.includes('phone') || cn.includes('cellular')) { subtype = 'Mobile Phone'; price = '₹100 – ₹1,200 per device'; }
    else if (cn.includes('laptop') || cn.includes('notebook')) { subtype = 'Laptop Computer'; price = '₹800 – ₹2,500 per device'; }
    else if (cn.includes('keyboard')) { subtype = 'Computer Keyboard'; price = '₹30 – ₹70 per piece'; }
    else if (cn.includes('mouse')) { subtype = 'Computer Mouse'; price = '₹20 – ₹50 per piece'; }
    else if (cn.includes('battery')) { subtype = 'Lead-Acid / Lithium Battery'; price = '₹55 – ₹75 per kg'; }
    else if (cn.includes('washer') || cn.includes('washing') || cn.includes('refrigerator') || cn.includes('fridge')) { subtype = 'Large Appliance (Washing Machine / Refrigerator)'; price = '₹800 – ₹2,500 per unit'; }
    else if (cn.includes('television') || cn.includes('tv') || cn.includes('monitor')) { subtype = 'Television / Display Monitor'; price = '₹300 – ₹1,200 per unit'; }
    else { subtype = 'Small Electronic Appliance'; price = '₹40 – ₹60 per kg'; }
  }
  else if (category === 'paper-cardboard') {
    if (cn.includes('newspaper') || cn.includes('pasti')) { subtype = 'Old Newspaper (Pasti)'; price = '₹14 – ₹16 per kg'; }
    else if (cn.includes('cardboard') || cn.includes('box') || cn.includes('carton') || cn.includes('puttha')) { subtype = 'Corrugated Cardboard (Puttha)'; price = '₹8 – ₹10 per kg'; }
    else if (cn.includes('book') || cn.includes('notebook')) { subtype = 'Old Books / Notebooks'; price = '₹11 – ₹13 per kg'; }
    else { subtype = 'Mixed Paper Waste'; price = '₹8 – ₹12 per kg'; }
  }
  else if (category === 'metal') {
    if (cn.includes('copper') || cn.includes('wire')) { subtype = 'Copper Scrap'; price = '₹480 – ₹550 per kg'; }
    else if (cn.includes('aluminum') || cn.includes('can')) { subtype = 'Aluminum Scrap / Cans'; price = '₹95 – ₹115 per kg'; }
    else if (cn.includes('iron') || cn.includes('steel')) { subtype = 'Iron / Steel Scrap'; price = '₹24 – ₹28 per kg'; }
    else if (cn.includes('brass')) { subtype = 'Brass Scrap'; price = '₹300 – ₹350 per kg'; }
    else { subtype = 'Mixed Metal Scrap'; price = '₹25 – ₹45 per kg'; }
  }
  else if (category === 'plastic') {
    if (cn.includes('bottle') || cn.includes('pet')) { subtype = 'PET Water / Soda Bottles'; price = '₹10 – ₹12 per kg'; }
    else if (cn.includes('bag') || cn.includes('poly') || cn.includes('ldpe')) { subtype = 'LDPE Soft Plastic Bags'; price = '₹4 – ₹6 per kg'; }
    else if (cn.includes('crate') || cn.includes('bucket') || cn.includes('furniture') || cn.includes('chair')) { subtype = 'Rigid HDPE/PP Scrap (Chairs/Buckets)'; price = '₹6 – ₹9 per kg'; }
    else { subtype = 'Mixed Plastics'; price = '₹5 – ₹8 per kg'; }
  }
  else if (category === 'furniture') {
    if (cn.includes('chair') || cn.includes('stool')) { subtype = 'Wooden / Plastic Chair'; price = '₹80 – ₹250 per piece'; }
    else if (cn.includes('table') || cn.includes('desk')) { subtype = 'Wooden Table / Desk'; price = '₹300 – ₹1,200 per piece'; }
    else if (cn.includes('sofa') || cn.includes('couch')) { subtype = 'Wooden Sofa Set'; price = '₹800 – ₹3,000 per set'; }
    else if (cn.includes('bed') || cn.includes('wardrobe')) { subtype = 'Wooden Bed / Wardrobe'; price = '₹1,000 – ₹4,000 per unit'; }
    else { subtype = 'Scrap Wood / Timber'; price = '₹10 – ₹15 per kg'; }
  }
  else if (category === 'agricultural') {
    if (cn.includes('rice') || cn.includes('parali')) { subtype = 'Rice Parali Stubble'; price = '₹2,200 per metric ton'; }
    else if (cn.includes('wheat') || cn.includes('bhusa')) { subtype = 'Wheat Straw / Bhusa'; price = '₹5,500 per metric ton'; }
    else if (cn.includes('cotton')) { subtype = 'Cotton Crop Stalks'; price = '₹3,200 per metric ton'; }
    else if (cn.includes('mustard')) { subtype = 'Mustard Crop Stalks'; price = '₹2,800 per metric ton'; }
    else if (cn.includes('coconut')) { subtype = 'Coconut Shells'; price = '₹6,000 per metric ton'; }
    else if (cn.includes('bagasse') || cn.includes('sugarcane')) { subtype = 'Sugarcane Bagasse'; price = '₹1,800 per metric ton'; }
  }
  
  return { subtype, price };
}

// Chatbot text interactions
let typingMsgCounter = 0;
function showTypingIndicator() {
  const messagesContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  const msgId = `typing-msg-${++typingMsgCounter}`;
  messageDiv.className = `chat-message bot`;
  messageDiv.id = msgId;
  messageDiv.innerHTML = `
    <div class="bubble">🤖 <em>analyzing request...</em></div>
  `;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return msgId;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

let lastUserMessageText = '';

function addChatMessage(sender, text, imageSrc = null, isHtml = false, chips = null) {
  const messagesContainer = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  const msgId = `chat-msg-${++msgCounter}`;
  messageDiv.id = msgId;
  messageDiv.className = `chat-message ${sender}`;

  let bubbleContent = '';
  if (imageSrc) {
    bubbleContent += `<img src="${imageSrc}" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px; border: 1px solid var(--line);" />`;
  }
  
  if (text) {
    // Parse markdown if Marked is loaded and sender is bot
    let formattedText = text;
    if (window.marked && sender === 'bot' && !isHtml) {
      formattedText = marked.parse(text);
    }
    bubbleContent += `<div>${formattedText}</div>`;
  }

  // Render choice chips inside the bubble if provided
  if (chips && chips.length > 0) {
    let chipsHtml = `<div class="choice-chips-inner-wrapper" style="display:flex; flex-direction:column; gap:8px; margin-top:16px; width:100%;">`;
    chips.forEach((opt) => {
      chipsHtml += `
        <button class="choice-chip" style="width:100%; text-align:left; padding: 12px 16px; background: white; border: 1px solid var(--line); border-radius: 12px; font-family: 'Inter', sans-serif; font-size: 13.5px; font-weight: 600; color: var(--moss-dark); cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; justify-content: space-between;" 
          onclick="handleChipClick('${opt.value}', this)"
          onmouseover="this.style.background='rgba(16, 185, 129, 0.05)'; this.style.borderColor='var(--moss)'; this.style.transform='translateX(4px)';" 
          onmouseout="this.style.background='white'; this.style.borderColor='var(--line)'; this.style.transform='translateX(0)';"
        >
          <span>${opt.text}</span>
          <span style="font-size: 11px; opacity: 0.6;">➔</span>
        </button>
      `;
    });
    chipsHtml += `</div>`;
    bubbleContent += chipsHtml;
  }

  let footerHtml = '';
  if (sender === 'bot') {
    // BUGFIX: action bar now always shows, even when chips (e.g. quantity buttons) are present.
    // footerHtml renders after bubbleContent (which includes chips), so like/dislike correctly appear below them.
    footerHtml = `
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-top:4px; padding:0 4px;">
        <div class="msg-action-bar">
          <button onclick="copyMessageText('${msgId}')" class="msg-action-btn copy-btn" title="Copy response">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          </button>
          <button onclick="speakMessageText('${msgId}')" class="msg-action-btn play-btn" title="Explain / Listen out loud">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <button onclick="likeMessage('${msgId}')" class="msg-action-btn like-btn" title="Like response">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
          </button>
          <button onclick="dislikeMessage('${msgId}')" class="msg-action-btn dislike-btn" title="Dislike / Give feedback">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm12-3h3a2 2 0 0 1 2 2v7a2 2 0 0 1 2 2h-3"></path></svg>
          </button>
          <button onclick="retryLastMessage('${msgId}')" class="msg-action-btn retry-btn" title="Regenerate answer">
            <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg>
          </button>
        </div>
        <div class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;
  } else {
    footerHtml = `<div class="time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
  }

  messageDiv.innerHTML = `
    <div class="bubble">${bubbleContent}</div>
    ${footerHtml}
  `;

  messagesContainer.appendChild(messageDiv);
  if (sender === 'bot') {
    setTimeout(() => {
      messageDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  } else {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  return msgId;
}

function copyMessageText(msgId) {
  const el = document.getElementById(msgId);
  if (!el) return;
  const bubble = el.querySelector('.bubble');
  if (!bubble) return;
  
  const textToCopy = bubble.innerText || bubble.textContent;
  navigator.clipboard.writeText(textToCopy).then(() => {
    const copyBtn = el.querySelector('.copy-btn');
    if (copyBtn) {
      const originalHtml = copyBtn.innerHTML;
      copyBtn.innerHTML = `✅`;
      setTimeout(() => {
        copyBtn.innerHTML = originalHtml;
      }, 1500);
    }
  }).catch(err => {
    console.error('Failed to copy text:', err);
  });
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  smoothMoveToMessageSystem();
  lastUserMessageText = text;
  addChatMessage('user', text);
  input.value = '';

  setTimeout(() => {
    respondToChatText(text);
  }, 600);
}

function sendSuggestion(text) {
  smoothMoveToMessageSystem();
  lastUserMessageText = text;
  addChatMessage('user', text);
  setTimeout(() => {
    respondToChatText(text);
  }, 600);
}

async function respondToChatText(text) {
  const apiKey = localStorage.getItem('gemini_api_key');
  const typingId = showTypingIndicator();
  
  if (apiKey) {
    try {
      const responseText = await callGeminiText(text);
      removeTypingIndicator(typingId);
      
      let cleanResponse = responseText;
      let targetCategory = null;
      
      // Parse target category if returned in tags
      const categoryMatch = cleanResponse.match(/\[Category:\s*([a-zA-Z-]+)\]/);
      if (categoryMatch) {
        targetCategory = categoryMatch[1].trim().toLowerCase();
        cleanResponse = cleanResponse.replace(/\[Category:\s*[a-zA-Z-]+\]/, '');
      }
      
      const msgId = addChatMessage('bot', cleanResponse);
      
      if (targetCategory && categoryConfig[targetCategory]) {
        initiateCategoryRouting(targetCategory);
      }
      
      speakTextAfterDelay(msgId);
      return;
    } catch (err) {
      console.error("Gemini text assistant failed, falling back to rules:", err);
    }
  }

  // Rule-based Fallback
  removeTypingIndicator(typingId);
  const lower = text.toLowerCase();
  let response = '';
  let targetCategory = null;

  if (lower.includes('phone') || lower.includes('laptop') || lower.includes('computer') || lower.includes('battery') || lower.includes('e-waste') || lower.includes('electronic') || lower.includes('mobile')) {
    targetCategory = 'e-waste';
    initiateCategoryRouting(targetCategory);
    return;
  } else if (lower.includes('food') || lower.includes('hotel') || lower.includes('restaurant') || lower.includes('organic') || lower.includes('wet waste') || lower.includes('kitchen')) {
    targetCategory = 'organic-food';
    initiateCategoryRouting(targetCategory);
    return;
  } else if (lower.includes('agricultural') || lower.includes('stubble') || lower.includes('parali') || lower.includes('straw') || lower.includes('husk') || lower.includes('farmer') || lower.includes('burn')) {
    targetCategory = 'agricultural';
    initiateCategoryRouting(targetCategory);
    return;
  } else if (lower.includes('glass') || lower.includes('bottle') || lower.includes('jar')) {
    targetCategory = 'glass';
  } else if (lower.includes('metal') || lower.includes('can') || lower.includes('tin') || lower.includes('scrap')) {
    targetCategory = 'metal';
  } else if (lower.includes('paper') || lower.includes('cardboard') || lower.includes('box') || lower.includes('carton')) {
    targetCategory = 'paper-cardboard';
  } else if (lower.includes('plastic') || lower.includes('bottle') || lower.includes('bag') || lower.includes('wrapper')) {
    targetCategory = 'plastic';
  } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('greetings') || lower.includes('help')) {
    response = `🤖 <strong>Hello!</strong> I am Punarchakra AI. Click the 📷 icon below to scan an image or ask a waste routing question! How can I help you today?`;
  } else {
    response = `🤖 <strong>Punarchakra AI:</strong><br><br>Please separate dry recyclables from wet waste. To locate recycling hubs, click the 📷 icon below to scan a photo, or select manually from the center panel!`;
  }

  if (targetCategory) {
    initiateCategoryRouting(targetCategory);
  } else {
    const msgId = addChatMessage('bot', response, null, true);
    speakTextAfterDelay(msgId);
  }
}

function playWelcomeChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    
    // Note 1 (E5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    
    // Note 2 (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc1.start(now);
    osc1.stop(now + 0.8);
    
    osc2.start(now + 0.12);
    osc2.stop(now + 1.0);
  } catch (e) {
    console.error("Audio chime failed:", e);
  }
}

// Set voice unmuted by default in header button
window.addEventListener('load', () => {
  const mainBtn = document.getElementById('voiceToggleBtn');
  const btnText = document.getElementById('voiceBtnText');
  if (mainBtn) mainBtn.classList.remove('muted');
  if (btnText) btnText.textContent = 'Voice On';
});

// Feedback Actions & RL Simulation
function likeMessage(msgId) {
  const el = document.getElementById(msgId);
  if (!el) return;
  
  const likeBtn = el.querySelector('.like-btn');
  const dislikeBtn = el.querySelector('.dislike-btn');
  
  if (likeBtn.classList.contains('active')) {
    likeBtn.classList.remove('active');
    saveFeedbackLog(msgId, 'like', false);
  } else {
    likeBtn.classList.add('active');
    dislikeBtn.classList.remove('active');
    closeFeedback(msgId);
    saveFeedbackLog(msgId, 'like', true);
    
    // Render helpful toast
    const toast = document.createElement('div');
    toast.style = "position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1e3a2f; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: fadeUpToast 0.3s ease-out;";
    toast.innerHTML = "👍 Thanks! Marked as helpful.";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }
}

function dislikeMessage(msgId) {
  const el = document.getElementById(msgId);
  if (!el) return;
  
  const likeBtn = el.querySelector('.like-btn');
  const dislikeBtn = el.querySelector('.dislike-btn');
  
  if (dislikeBtn.classList.contains('active')) {
    dislikeBtn.classList.remove('active');
    closeFeedback(msgId);
    saveFeedbackLog(msgId, 'dislike', false);
  } else {
    dislikeBtn.classList.add('active');
    likeBtn.classList.remove('active');
    saveFeedbackLog(msgId, 'dislike', true);
    showFeedbackPanel(msgId);
  }
}

function showFeedbackPanel(msgId) {
  const el = document.getElementById(msgId);
  if (!el) return;
  if (document.getElementById(`feedback-panel-${msgId}`)) return;
  
  const panel = document.createElement('div');
  panel.id = `feedback-panel-${msgId}`;
  panel.style = "margin-top: 10px; background: rgba(220, 53, 69, 0.03); border: 1px solid rgba(220, 53, 69, 0.15); border-radius: 12px; padding: 12px; font-size: 12.5px; width: 100%; max-width: 480px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); animation: slideDownPanel 0.2s ease-out;";
  panel.innerHTML = `
    <div style="font-weight: 600; color: #b91c1c; margin-bottom: 6px;">How can we improve this response?</div>
    <textarea id="feedback-text-${msgId}" placeholder="Describe the issue (e.g. wrong price, bad classification)..." style="width: 100%; border: 1px solid var(--line); border-radius: 8px; padding: 8px; font-family: 'Inter', sans-serif; font-size: 12px; resize: vertical; height: 60px; outline: none; margin-bottom: 8px; background: white; color: var(--ink);"></textarea>
    <div style="display: flex; gap: 8px; justify-content: flex-end;">
      <button onclick="submitFeedback('${msgId}')" style="background: #b91c1c; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer;">Submit Feedback</button>
      <button onclick="closeFeedback('${msgId}')" style="background: transparent; color: var(--grey); border: 1px solid var(--line); padding: 6px 12px; border-radius: 6px; font-size: 11px; cursor: pointer;">Cancel</button>
    </div>
  `;
  el.appendChild(panel);
}

function closeFeedback(msgId) {
  const panel = document.getElementById(`feedback-panel-${msgId}`);
  if (panel) panel.remove();
}

function submitFeedback(msgId) {
  const textVal = document.getElementById(`feedback-text-${msgId}`)?.value || '';
  closeFeedback(msgId);
  
  const logs = JSON.parse(localStorage.getItem('feedback_logs') || '[]');
  logs.push({
    msgId: msgId,
    feedback: textVal,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('feedback_logs', JSON.stringify(logs));
  
  const toast = document.createElement('div');
  toast.style = "position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1e3a2f; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-family: 'Inter', sans-serif; z-index: 10000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);";
  toast.innerHTML = "✅ Feedback saved! Punarchakra AI is learning from your input.";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function saveFeedbackLog(msgId, action, state) {
  const logs = JSON.parse(localStorage.getItem('action_logs') || '[]');
  logs.push({
    msgId: msgId,
    action: action,
    state: state,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('action_logs', JSON.stringify(logs));
}

// Speech Assistant play/pause explaining
let currentSpeakingId = null;
function speakMessageText(msgId) {
  if (currentSpeakingId === msgId && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    currentSpeakingId = null;
    updatePlayButtonIcon(msgId, false);
    return;
  }
  
  const el = document.getElementById(msgId);
  if (!el) return;
  const bubble = el.querySelector('.bubble');
  if (!bubble) return;
  
  currentSpeakingId = msgId;
  updatePlayButtonIcon(msgId, true);
  
  const textToSpeak = bubble.innerText || bubble.textContent;
  speakText(textToSpeak);
  
  // Auto-reset button on speech end
  const checkSpeechEnd = setInterval(() => {
    if (!window.speechSynthesis.speaking) {
      clearInterval(checkSpeechEnd);
      if (currentSpeakingId === msgId) {
        currentSpeakingId = null;
        updatePlayButtonIcon(msgId, false);
      }
    }
  }, 500);
}

function updatePlayButtonIcon(msgId, isPlaying) {
  const el = document.getElementById(msgId);
  if (!el) return;
  const playBtn = el.querySelector('.play-btn');
  if (!playBtn) return;
  
  if (isPlaying) {
    playBtn.classList.add('active');
    playBtn.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
  } else {
    playBtn.classList.remove('active');
    playBtn.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  }
}

function retryLastMessage(msgId) {
  if (!lastUserMessageText) {
    alert("No previous message to retry.");
    return;
  }
  const el = document.getElementById(msgId);
  if (el) {
    const btn = el.querySelector('.retry-btn');
    if (btn) {
      btn.style.transform = 'rotate(360deg)';
      btn.style.transition = 'transform 0.6s ease';
    }
  }
  setTimeout(() => {
    respondToChatText(lastUserMessageText);
  }, 300);
}

// Google Translate Scripts Integration
function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {pageLanguage: 'en'},
    'google_translate_element'
  );
}
let changeLanguageAttempts = 0;
function changeLanguage(langCode) {
  const googleCombo = document.querySelector('.goog-te-combo');
  if (googleCombo) {
    googleCombo.value = langCode;
    googleCombo.dispatchEvent(new Event('change'));
    changeLanguageAttempts = 0;
  } else {
    changeLanguageAttempts++;
    if (changeLanguageAttempts < 15) {
      setTimeout(() => changeLanguage(langCode), 200);
    } else {
      console.warn("Google Translate combo box not found; translation might not apply.");
      changeLanguageAttempts = 0;
    }
  }
  // Sync the custom dropdowns
  const customSelect = document.getElementById('customLangSelect');
  if (customSelect) {
    customSelect.value = langCode;
  }
  const drawerSelect = document.getElementById('drawerLangSelect');
  if (drawerSelect) {
    drawerSelect.value = langCode;
  }
  // Update brand header script title dynamically
  updateBrandTitle(langCode);
}

function updateBrandTitle(langCode) {
  const titleEl = document.getElementById('brandTitle');
  const taglineEl = document.getElementById('brandTagline');
  const labelEl = document.getElementById('langSelectLabel');
  
  const brandTitles = {
    'en': 'Punarchakra<span class="brand-router">AI</span>',
    'hi': 'पुनर्चक्र<span class="brand-router">AI</span>',
    'gu': 'પુનર્ચક્ર<span class="brand-router">AI</span>',
    'mr': 'पुनर्चक्र<span class="brand-router">AI</span>',
    'ta': 'புனர்சக்ரா<span class="brand-router">AI</span>',
    'te': 'పునర్ చక్ర<span class="brand-router">AI</span>'
  };
  
  const brandTaglines = {
    'en': 'Wealth from Waste — Smart Recycling Assistant',
    'hi': 'कचरे से कंचन — स्मार्ट रीसाइक्लिंग असिस्टेंट',
    'gu': 'કચરામાંથી કંચન — સ્માર્ટ રિસાયક્લિંગ આસિસ્ટન્ટ',
    'mr': 'कचऱ्यातून सोने — स्मार्ट रीसायकलिंग असिस्टंट',
    'ta': 'குப்பையிலிருந்து செல்வம் — ஸ்மார்ட் மறுசுழற்சி உதவியாளர்',
    'te': 'వ్యర్థాల నుండి సంపద — స్మార్ట్ రీసైక్లింగ్ అసిస్టెంట్'
  };

  const langLabels = {
    'en': 'Language',
    'hi': 'भाषा',
    'gu': 'ભાષા',
    'mr': 'भाषा',
    'ta': 'மொழி',
    'te': 'భాష'
  };
  
  if (titleEl) {
    titleEl.innerHTML = brandTitles[langCode] || brandTitles['en'];
  }
  if (taglineEl) {
    taglineEl.innerHTML = brandTaglines[langCode] || brandTaglines['en'];
  }
  if (labelEl) {
    labelEl.textContent = langLabels[langCode] || langLabels['en'];
  }
}

function getTranslateLanguage() {
  const cookieMatch = document.cookie.match(/googtrans=\/[a-zA-Z-]+\/([a-zA-Z-]+)/);
  if (cookieMatch && cookieMatch[1]) {
    return cookieMatch[1].toLowerCase();
  }
  const googleCombo = document.querySelector('.goog-te-combo');
  if (googleCombo && googleCombo.value) {
    return googleCombo.value;
  }
  return document.getElementById('customLangSelect')?.value || document.getElementById('drawerLangSelect')?.value || 'en';
}

function toggleMobileDrawer() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (drawer && overlay) {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      overlay.style.display = 'none';
    } else {
      drawer.classList.add('open');
      overlay.style.display = 'block';
    }
  }
}

window.addEventListener('load', () => {
  // Apply brand title immediately on load
  const initialLang = getTranslateLanguage();
  updateBrandTitle(initialLang);
  const customSelect = document.getElementById('customLangSelect');
  if (customSelect) customSelect.value = initialLang;
  const drawerSelect = document.getElementById('drawerLangSelect');
  if (drawerSelect) drawerSelect.value = initialLang;

  const checkInterval = setInterval(() => {
    const googleCombo = document.querySelector('.goog-te-combo');
    if (googleCombo) {
      clearInterval(checkInterval);
      const activeLang = getTranslateLanguage();
      if (customSelect) customSelect.value = activeLang;
      if (drawerSelect) drawerSelect.value = activeLang;
      updateBrandTitle(activeLang);
    }
  }, 500);
  setTimeout(() => clearInterval(checkInterval), 15000);
});

// Initialize Edge AI on load
initClassifier();
window.addEventListener('load', renderCategoryShowcase);
window.addEventListener('load', renderHomeVideos);

// Expose functions globally for inline HTML event handlers
window.handleFileChange = handleFileChange;
window.triggerChatUpload = triggerChatUpload;
window.handleInputKeydown = handleInputKeydown;
window.handleCategorySelectChange = handleCategorySelectChange;
window.requestUserLocation = requestUserLocation;
window.sendChatMessage = sendChatMessage;
window.toggleVoiceInput = toggleVoiceInput;
window.copyMessageText = copyMessageText;
window.speakMessageText = speakMessageText;
window.likeMessage = likeMessage;
window.dislikeMessage = dislikeMessage;
window.retryLastMessage = retryLastMessage;
window.submitFeedback = submitFeedback;
window.closeFeedback = closeFeedback;
window.sendSuggestion = sendSuggestion;
window.changeLanguage = changeLanguage;
window.updateBrandTitle = updateBrandTitle;
window.googleTranslateElementInit = googleTranslateElementInit;
window.handleChipClick = handleChipClick;
window.toggleMobileDrawer = toggleMobileDrawer;

function switchMobileTab(tab) {
  const mainEl = document.querySelector('main');
  const tabChat = document.getElementById('tabBtnChat');
  const tabMap = document.getElementById('tabBtnMap');
  if (!mainEl) return;
  
  if (tab === 'chat') {
    mainEl.classList.add('mobile-tab-chat');
    mainEl.classList.remove('mobile-tab-map');
    if (tabChat) tabChat.classList.add('active');
    if (tabMap) tabMap.classList.remove('active');
  } else {
    mainEl.classList.add('mobile-tab-map');
    mainEl.classList.remove('mobile-tab-chat');
    if (tabChat) tabChat.classList.remove('active');
    if (tabMap) tabMap.classList.add('active');
    // Force redraw of Google Map inside iframe when tab opens
    const mapFrame = document.getElementById('mapFrame');
    if (mapFrame) {
      mapFrame.src = mapFrame.src;
    }
  }
}
window.switchMobileTab = switchMobileTab;

// 3D Interactive Background Initialization using Three.js
function init3DBackground() {
  const canvas = document.getElementById('bg-3d');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const createLeafTexture = (size = 256) => {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = size;
    textureCanvas.height = size;
    const ctx = textureCanvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    ctx.translate(size / 2, size / 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.34);
    ctx.bezierCurveTo(size * 0.2, -size * 0.2, size * 0.2, size * 0.1, 0, size * 0.34);
    ctx.bezierCurveTo(-size * 0.2, size * 0.1, -size * 0.2, -size * 0.2, 0, -size * 0.34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = size * 0.022;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.26);
    ctx.lineTo(0, size * 0.26);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.06);
    ctx.lineTo(size * 0.12, -size * 0.14);
    ctx.moveTo(0, size * 0.02);
    ctx.lineTo(size * 0.12, -size * 0.02);
    ctx.moveTo(0, size * 0.08);
    ctx.lineTo(size * 0.1, size * 0.16);
    ctx.moveTo(0, -size * 0.06);
    ctx.lineTo(-size * 0.12, -size * 0.14);
    ctx.moveTo(0, size * 0.02);
    ctx.lineTo(-size * 0.12, -size * 0.02);
    ctx.moveTo(0, size * 0.08);
    ctx.lineTo(-size * 0.1, size * 0.16);
    ctx.stroke();
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.needsUpdate = true;
    return texture;
  };

  const leafTexture = createLeafTexture();
  const leaves = [];

  for (let i = 0; i < 90; i++) {
    const leaf = new THREE.Sprite(new THREE.SpriteMaterial({
      map: leafTexture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
      color: i % 4 === 0 ? 0xa7f3d0 : 0x22c55e
    }));

    const size = 0.42 + Math.random() * 0.68;
    leaf.scale.set(size * 1.15, size, 1);
    leaf.position.set(
      (Math.random() - 0.5) * 42,
      (Math.random() - 0.5) * 28,
      -3 - Math.random() * 12
    );
    leaf.rotation = Math.random() * Math.PI * 2;
    leaf.userData = {
      speedX: (Math.random() - 0.5) * 0.02,
      speedY: 0.02 + Math.random() * 0.03,
      sway: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.01,
      baseScale: size
    };
    leaves.push(leaf);
    scene.add(leaf);
  }

  camera.position.z = 18;

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;

  window.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - window.innerWidth / 2) / 160;
    mouseY = (event.clientY - window.innerHeight / 2) / 160;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  function animate() {
    requestAnimationFrame(animate);

    targetX += (mouseX - targetX) * 0.04;
    targetY += (mouseY - targetY) * 0.04;

    camera.position.x = targetX * 1.3;
    camera.position.y = -targetY * 1.1;
    camera.lookAt(scene.position);

    leaves.forEach((leaf, index) => {
      leaf.position.y += leaf.userData.speedY;
      leaf.position.x += leaf.userData.speedX + Math.sin(Date.now() * 0.0008 + leaf.userData.phase) * 0.005 * leaf.userData.sway;
      leaf.material.rotation += leaf.userData.spin;
      leaf.material.opacity = 0.42 + Math.sin(Date.now() * 0.0011 + leaf.userData.phase) * 0.08;

      if (leaf.position.y > 18) {
        leaf.position.y = -18;
        leaf.position.x = (Math.random() - 0.5) * 42;
      }

      if (leaf.position.x > 24) leaf.position.x = -24;
      if (leaf.position.x < -24) leaf.position.x = 24;

      const breathe = 0.9 + Math.sin(Date.now() * 0.001 + index) * 0.04;
      leaf.scale.set(leaf.userData.baseScale * 1.15 * breathe, leaf.userData.baseScale * breathe, 1);
    });

    renderer.render(scene, camera);
  }

  animate();
}

// Call on window load or when ready
window.addEventListener('load', init3DBackground);

