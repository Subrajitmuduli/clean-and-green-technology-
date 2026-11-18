import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  IconButton
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const faqs = [
  {
    question: "How do I report waste on GreenTrack?",
    answer: "Go to the 'Report Waste' tab from the navigation bar. You can upload an image of the waste, describe its type and quantity, and submit it for verification. Once verified by an admin, you will receive Green Coins!"
  },
  {
    question: "How can I earn Green Coins?",
    answer: "You earn Green Coins primarily by reporting waste, completing interactive courses, reading sustainability guides, and successfully sorting your household trash. You can view your balance by clicking your profile icon."
  },
  {
    question: "How do I redeem my Green Coins?",
    answer: "During checkout in the Marketplace, if your current balance is 10 coins or more, an option will appear to 'Redeem Green Coins'. Check the box to apply a discount to your cart total."
  },
  {
    question: "Is there a limit to how much waste I can report?",
    answer: "There are no limits! However, all reports must be approved by our admin team before coins are credited to your account to prevent spam."
  }
];

const BOT_NAME = "GreenBot AI";

// Track response history to avoid repetition
let lastResponseCategory = '';
let fallbackIndex = 0;
let categoryResponseIndex = {};

// Multiple response variants per category to avoid repetition
const RESPONSE_VARIANTS = {
  greeting: [
    "Hello there! I am GreenBot 🌿, your personal eco-assistant. How can I help you make the planet cleaner today?",
    "Hey! 👋 Welcome to GreenTrack support. I'm GreenBot — what can I help you with? Try asking about 'reporting waste', 'coins', or 'courses'!",
    "Hi there! Great to see you! 🌍 I'm GreenBot, ready to help with anything GreenTrack-related. What's on your mind?"
  ],
  howAreYou: [
    "I'm functioning perfectly at 100% renewable energy! Ready to help you with GreenTrack. What do you need assistance with?",
    "I'm running great, thanks for asking! 🔋 Let me know how I can help you today — waste reporting, coins, marketplace, or something else?",
    "Doing wonderful! Every interaction here helps the planet. How can I assist you today?"
  ],
  identity: [
    "I'm GreenBot! An intelligent assistant designed by the GreenTrack team specifically to help you navigate our platform and learn more about sustainability.",
    "I'm GreenBot AI 🤖, the official virtual assistant for GreenTrack. I can help with reporting waste, earning coins, shopping eco-friendly, and more!",
    "My name is GreenBot — I was built to make your GreenTrack experience smooth and informative. Ask me anything about the platform!"
  ],
  platform: [
    "GreenTrack is a revolutionary platform aimed at gamifying waste management. You can report waste, learn about sustainability, and earn Green Coins to spend in our eco-friendly marketplace!",
    "GreenTrack is a sustainability gamification platform! Here's how it works: Report waste ➜ Get verified ➜ Earn Green Coins ➜ Spend them on eco-friendly products in our Marketplace!",
    "GreenTrack combines technology with environmentalism. You report waste, take courses, earn coins, and shop green — all in one platform. 🌱"
  ],
  howItWorks: [
    "It's simple: 1. Register an account. 2. Report waste you find in your area. 3. Admins verify it and reward you with Green Coins. 4. Spend those coins in our Eco-Marketplace!",
    "Getting started is easy! Sign up, then head to 'Report Waste' to submit a photo of waste near you. Once approved, you'll earn Green Coins that can be redeemed for eco-friendly products!",
    "Here's the flow: Sign up ➜ Report Waste (snap a photo!) ➜ Admin approves ➜ You earn Green Coins ➜ Shop in our Marketplace. Simple and rewarding! 🎉"
  ],
  reporting: [
    "To report waste, visit the 'Report Waste' tab. You'll need to upload a clear photo, select the waste type, and allow GPS access. We also offer Anonymous Reporting if you'd prefer not to attach your account!",
    "Head to the 'Report Waste' page from the navigation bar. Snap a live photo using your camera, select the waste category and severity, and hit submit. Your location is auto-detected via GPS! 📍",
    "Reporting waste is quick: Navigate to 'Report Waste', capture a photo, choose the type (Plastic, E-waste, etc.), and submit. You'll see your report status under 'Earn Coins'. 📸"
  ],
  anonymous: [
    "Yes! You can report waste anonymously by checking the 'Report Anonymously' box. Your identity will be hidden, but note that anonymous reports cannot earn Green Coins.",
    "Absolutely! The anonymous option is available when you submit a report. Just keep in mind that anonymous reports won't earn you coins, but they still contribute to a cleaner environment. 🤫"
  ],
  verification: [
    "Waste reports are typically reviewed by our local administrative team within 24 to 48 hours. Once approved, the coins reflect instantly in your balance.",
    "Our admin team reviews each report carefully. Once approved, your Green Coins are credited automatically. Most reports are processed within 24-48 hours! ⏳"
  ],
  coins: [
    "Green Coins are our virtual currency! You earn 20-75 coins per approved waste report based on severity. You can also earn them by taking Courses. Use them for massive discounts during checkout!",
    "You earn Green Coins for every approved waste report! The amount varies by severity (20-75 coins). Complete our interactive Courses for bonus coins too. Check your balance on your profile page! 🪙",
    "Green Coins reward your eco-actions! Earn them through waste reporting and courses. Visit 'Earn Coins' to see your full history, pending rewards, and cleanup progress tracker."
  ],
  coinValue: [
    "10 Green Coins = ₹1 discount in the marketplace. For example, severe e-waste reports reward you with 75 Coins, which gives you ₹7.5 off your next eco-purchase!",
    "The conversion is simple: every 10 coins = ₹1 off your order. The more you report, the more you save! E-waste and high-severity reports earn the most coins (up to 75)."
  ],
  marketplace: [
    "Our Marketplace features strictly eco-friendly products like reusable bottles, bamboo brushes, organic fertilizers, and solar chargers. Head over to the 'Market Place' tab to explore and apply your Green Coins!",
    "Check out the 'Marketplace' tab for eco-friendly products! We have everything from organic plants to solar chargers. You can apply your Green Coins at checkout for instant discounts. 🛒",
    "The Marketplace is your go-to for sustainable shopping! Browse eco products, add them to your cart, and use your earned Green Coins for great discounts during checkout."
  ],
  products: [
    "Ah, you're looking for specific green items! Check our 'Marketplace' tab. We have Lemon Plants, Mango Plants, Solar Lanterns, Bamboo Toothbrushes, and more in stock.",
    "We stock a range of eco-friendly products: Saplings, Solar Lanterns, Reusable Bottles, Bamboo products, and Organic Fertilizers. Head to the Marketplace to browse! 🌿"
  ],
  cart: [
    "We currently support Cash on Delivery (COD) to keep things simple and local. You can view your cart by clicking the shopping bag icon, proceed to checkout, enter your delivery details, and apply your Green Coins for a discount!",
    "Shopping is easy! Add items to your cart, proceed to checkout, fill in your delivery details, and choose Cash on Delivery. Don't forget to apply your Green Coins for extra savings! 💰"
  ],
  orders: [
    "To manage your purchases or view your order history, click on your user profile avatar in the upper right corner of the navigation bar, and select 'Order History'.",
    "Your past orders are stored in your Profile under 'Order History'. You can see itemized details, discounts applied, and order status all in one place."
  ],
  courses: [
    "We offer interactive courses on Recycling, Sustainable Living, E-Waste Awareness, and more! Completing these courses is a fantastic way to earn easy Green Coins while educating yourself. Click the 'Courses' tab to start.",
    "Our Courses section has modules on Recycling, Energy Conservation, Carbon Footprint, and more. Each course has a reading section + quiz. Pass the quiz to earn Green Coins! 📚",
    "Want to learn AND earn? Head to the 'Courses' tab! Complete eco-learning modules and quizzes to add coins to your balance. It's education that literally pays off! 🎓"
  ],
  password: [
    "If you forgot your password, click 'Login' in the navigation bar, then click 'Forgot Password?'. You can verify using your registered email or phone number to reset it securely.",
    "To reset your password: Click 'Login' ➜ 'Forgot Password?' ➜ Enter your registered email or phone number ➜ Verify your identity ➜ Set a new password. It's quick and secure! 🔐"
  ],
  account: [
    "You can manage your account by clicking the 'Login' or 'Register' buttons in the top navigation bar. Registration takes less than 30 seconds!",
    "Getting an account is quick! Click 'Register' to sign up with your name, email, and phone. Already have one? Click 'Login' to access your profile and features."
  ],
  logout: [
    "To log out, tap your profile avatar icon in the top right corner and select 'Logout'.",
    "You can log out anytime by clicking your profile icon in the navigation bar and selecting the 'Logout' option."
  ],
  admin: [
    "If you are an administrator, you can access the secure dashboard by navigating to the '/admin' URL. You must enter the admin password to view and process pending user waste reports.",
    "The Admin Dashboard is accessible at '/admin'. It requires authentication and lets admins approve/reject reports and manage the cleanup workflow."
  ],
  recycle: [
    "Proper segregation is vital! Plastic, glass, and paper should be cleaned before recycling. E-waste (batteries, electronics) is especially toxic and should never be mixed with regular garbage — which is why we reward it heavily!",
    "Recycling tips: Rinse containers before recycling, separate e-waste from household waste, and use GreenTrack to report waste you spot in your community. Together we can make a huge impact! ♻️"
  ],
  thanks: [
    "You're very welcome! Keep up the great work keeping our planet green. Let me know if you need anything else. 🌍",
    "Happy to help! 😊 Remember, every eco-action counts. Feel free to ask me anything else about GreenTrack!",
    "Glad I could assist! Keep reporting waste and earning those Green Coins — you're making a real difference! 🌱"
  ],
  bye: [
    "Goodbye! Stay green, reduce your carbon footprint, and have a wonderful day! 🌱",
    "See you later! Keep up the amazing eco-work. The planet thanks you! 🌍✨",
    "Bye for now! Remember — every small eco-action adds up to big change. Take care! 💚"
  ],
  help: [
    "If my answers aren't enough, you can find our support email (contact@greentrack.ai) and phone number (+91 9634552251) in the footer section at the bottom of the home page!",
    "Need more help? Check the FAQs on the left, or reach out to us via the contact details in the Home page footer. I'm also here 24/7 if you have more questions! 📧"
  ],
  leaderboard: [
    "The Leaderboard ranks all GreenTrack users by their approved waste reports! The top 3 get a special podium display. Stay at #1 for 7 days to earn the exclusive 'Volunteer Champion' badge! 🏆",
    "Check out the 'Leaderboard' page to see where you rank among fellow eco-warriors! Compete by reporting more waste and climbing to the top. Top ranker for 7 days gets a special badge!"
  ],
  profile: [
    "Your Profile page shows your stats, achievements, and lets you edit your personal info. Click your avatar in the navigation bar to access it. You can also upload a profile photo! 📸",
    "Head to 'My Profile' from the menu to view your Green Coins balance, report history, rank, achievements, and more. You can edit your details and upload a photo too!"
  ],
};

// Get a non-repeating variant for a category
const getVariant = (category) => {
  const variants = RESPONSE_VARIANTS[category];
  if (!variants) return null;
  
  // If same category asked consecutively, rotate to next variant
  if (!categoryResponseIndex[category]) categoryResponseIndex[category] = 0;
  
  if (lastResponseCategory === category) {
    categoryResponseIndex[category] = (categoryResponseIndex[category] + 1) % variants.length;
  }
  
  lastResponseCategory = category;
  return variants[categoryResponseIndex[category]];
};

// Enhanced keyword logic with anti-repetition
const getHeuristicResponse = (message) => {
  const msg = message.toLowerCase();
  
  // 1. Greetings & Small Talk
  if (msg.match(/\b(hello|hi|hey|greetings|good morning|good afternoon|good evening|sup|hiya)\b/)) {
    return getVariant('greeting');
  } 
  if (msg.match(/\b(how are you|how's it going|how are things|are you okay)\b/)) {
    return getVariant('howAreYou');
  }
  if (msg.match(/\b(who are you|what are you|bot|ai|your name|who made you)\b/)) {
    return getVariant('identity');
  }
  
  // 2. Platform Information
  if (msg.match(/\b(what is greentrack|about greentrack|mission|vision|what do you do|purpose)\b/)) {
    return getVariant('platform');
  }
  if (msg.match(/\b(how does it work|how to use|getting started|start)\b/)) {
    return getVariant('howItWorks');
  }

  // 3. Leaderboard & Profile (new categories)
  if (msg.match(/\b(leaderboard|rank|ranking|top|champion|compete|competition)\b/)) {
    return getVariant('leaderboard');
  }
  if (msg.match(/\b(profile|my account|my info|my details|avatar|photo)\b/)) {
    return getVariant('profile');
  }

  // 4. Reporting Waste
  if (msg.match(/\b(report|waste|trash|garbage|dump|litter|upload|photo|picture|location|GPS)\b/)) {
    return getVariant('reporting');
  }
  if (msg.match(/\b(anonymous|without account|safely|hide identity)\b/)) {
    return getVariant('anonymous');
  }
  if (msg.match(/\b(how long|verification time|when will it be approved|pending)\b/)) {
    return getVariant('verification');
  }

  // 5. Green Coins & Rewards
  if (msg.match(/\b(coin|coins|reward|money|points|earn|redeem|balance|check balance)\b/)) {
    return getVariant('coins');
  }
  if (msg.match(/\b(how many coins|coin value|worth|conversion)\b/)) {
    return getVariant('coinValue');
  }

  // 6. Marketplace & Orders
  if (msg.match(/\b(buy|shop|market|marketplace|product|products|store|item)\b/)) {
    return getVariant('marketplace');
  }
  if (msg.match(/\b(plant|mango|lemon|fertilizer|bag|bottle|solar)\b/)) {
    return getVariant('products');
  }
  if (msg.match(/\b(cart|checkout|pay|payment|cod|cash on delivery|credit card)\b/)) {
    return getVariant('cart');
  }
  if (msg.match(/\b(order|orders|history|past|tracking|where is my order|cancel)\b/)) {
    return getVariant('orders');
  }

  // 7. Courses & Learning
  if (msg.match(/\b(course|courses|learn|study|education|quiz|modules)\b/)) {
    return getVariant('courses');
  }

  // 8. Account Management
  if (msg.match(/\b(password|forgot|reset|change password)\b/)) {
    return getVariant('password');
  }
  if (msg.match(/\b(login|register|account|sign up|sign in|create account)\b/)) {
    return getVariant('account');
  }
  if (msg.match(/\b(logout|sign out)\b/)) {
    return getVariant('logout');
  }

  // 9. Admin & Approvals
  if (msg.match(/\b(admin|approve|reject|verify|dashboard|verification)\b/)) {
    return getVariant('admin');
  }

  // 10. Generic Sustainability
  if (msg.match(/\b(recycle|recycling|plastic|glass|paper|e-waste|electronic)\b/)) {
    return getVariant('recycle');
  }

  // 11. Closures
  if (msg.match(/\b(thank|thanks|appreciate|helpful|good bot|awesome)\b/)) {
    return getVariant('thanks');
  }
  if (msg.match(/\b(bye|goodbye|see ya|quit|exit)\b/)) {
    return getVariant('bye');
  }
  if (msg.match(/\b(help|support|contact|email|phone)\b/)) {
    return getVariant('help');
  }
  
  // Smart cycling fallback — never repeats the same one consecutively
  const fallbacks = [
    "I'm still learning! Could you specify if you need help with 'reporting waste', 'earning coins', 'the marketplace', or 'your account'?",
    "That's an interesting question! Try asking about specific topics like 'How do I report waste?', 'How do coins work?', or 'Tell me about courses'.",
    "I might not have the exact answer for that yet. Have you tried checking our Frequently Asked Questions on the left side of this page?",
    "Hmm, I didn't quite catch that. Try asking about the 'Leaderboard', 'Profile', 'Marketplace', or 'Courses' and I'll be more helpful!",
    "I'm a specialized eco-bot, so I work best with GreenTrack topics! Try: 'How to earn coins?', 'What products are available?', or 'How does reporting work?'",
    "Not sure about that one! Here are some things I'm great at: waste reporting, Green Coins, eco-marketplace, sustainability courses, and account management. What interests you?",
    "I appreciate the question! For the best experience, ask me about specific GreenTrack features. For example: 'How to redeem coins?' or 'What is the leaderboard?'"
  ];
  
  lastResponseCategory = 'fallback';
  const response = fallbacks[fallbackIndex % fallbacks.length];
  fallbackIndex++;
  return response;
};

const generateBotResponse = async (message, conversationHistory = []) => {
  // Use a Gemini API key if present, otherwise fallback to the fast heuristic engine
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

  if (!apiKey) {
    return getHeuristicResponse(message);
  }

  try {
    // Build conversation context for Gemini to avoid repetitive responses
    const systemPrompt = `You are GreenBot, the official customer support AI for GreenTrack. GreenTrack is a sustainable gamification platform where users: 1. Report waste anonymously or securely to earn 'Green Coins', 2. Spend Green Coins in the 'Marketplace' on eco-friendly items, 3. Complete 'Courses' to learn and earn coins, 4. Compete on the 'Leaderboard' based on approved reports, 5. Manage their past purchases in their Profile > Order History. 

IMPORTANT RULES:
- Never repeat the same answer you already gave in this conversation.
- If the user asks the same question again, acknowledge it and add new details or suggest related topics.
- Keep responses conversational, friendly, concise (2-3 sentences max), and accurate to this platform.
- Never make up fake URLs or pages.
- If unsure, suggest the user check the FAQ section or contact support.`;

    // Build conversation messages for context
    const contents = [];
    
    // Add recent conversation history (last 6 messages for context)
    const recentHistory = conversationHistory.slice(-6);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    }
    
    // Add current user message with system context
    contents.push({
      role: 'user',
      parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
    });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();
    if (data.candidates && data.candidates[0].content.parts[0].text) {
      return data.candidates[0].content.parts[0].text.trim();
    } else {
       return getHeuristicResponse(message);
    }
  } catch (error) {
    return getHeuristicResponse(message);
  }
};

const HelpPage = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hi! I am GreenBot. How can I assist you with GreenTrack today?', time: new Date() }
  ]);
  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputVal.trim()) return;

    const userMsg = { sender: 'user', text: inputVal.trim(), time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    // Add a temporary typing indicator message
    setMessages(prev => [...prev, { sender: 'bot', text: 'Typing...', time: new Date(), isTyping: true }]);

    // Fetch intelligent response from Gemini (pass conversation history for context)
    const currentMessages = [...messages, userMsg];
    const aiResponseText = await generateBotResponse(userMsg.text, currentMessages);

    // Remove typing indicator and add real message
    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isTyping);
      return [...filtered, { sender: 'bot', text: aiResponseText, time: new Date() }];
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Typography
        variant="h4"
        sx={{
          color: theme.palette.primary.main,
          mb: 4,
          fontWeight: "800",
          textAlign: "center",
          letterSpacing: "-0.5px"
        }}
      >
        Help & Support
      </Typography>

      <Grid container spacing={4}>
        {/* FAQ Section */}
        <Grid item xs={12} md={5}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: '700', color: theme.palette.primary.main }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((faq, index) => (
            <Accordion 
              key={index} 
              sx={{ 
                mb: 2, 
                borderRadius: '12px !important', 
                boxShadow: theme.palette.mode === 'light' ? '0 4px 20px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.3)',
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
                <Typography sx={{ fontWeight: '600' }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.02)' }}>
                <Typography color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Grid>

        {/* AI Chatbot Interface */}
        <Grid item xs={12} md={7}>
          <Paper 
            sx={{ 
              height: '600px', 
              display: 'flex', 
              flexDirection: 'column', 
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: theme.palette.mode === 'light' ? '0 10px 40px -10px rgba(0,0,0,0.1)' : '0 10px 40px -10px rgba(0,0,0,0.4)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)'}`
            }}
          >
            {/* Header */}
            <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'white', color: theme.palette.primary.main }}>
                <SupportAgentIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: '700', lineHeight: 1.2 }}>{BOT_NAME}</Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>Online 24/7 • Automated Assistant</Typography>
              </Box>
            </Box>

            {/* Chat Area */}
            <Box 
              sx={{ 
                flexGrow: 1, 
                p: 3, 
                overflowY: 'auto', 
                bgcolor: theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {messages.map((msg, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row',
                    gap: 1.5,
                    alignItems: 'flex-end'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: msg.sender === 'user' ? '#3b82f6' : '#10b981' 
                    }}
                  >
                    {msg.sender === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
                  </Avatar>
                  <Box 
                    sx={{ 
                      maxWidth: '70%', 
                      p: 2, 
                      borderRadius: '16px',
                      borderBottomLeftRadius: msg.sender === 'bot' ? '4px' : '16px',
                      borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                      bgcolor: msg.sender === 'user' 
                        ? (theme.palette.mode === 'dark' ? '#1e3a8a' : '#bfdbfe') 
                        : (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#d1fae5'),
                      color: msg.sender === 'user'
                        ? (theme.palette.mode === 'dark' ? '#bfdbfe' : '#1e3a8a')
                        : (theme.palette.mode === 'dark' ? '#a7f3d0' : '#065f46'),
                    }}
                  >
                    <Typography variant="body1">{msg.text}</Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6, mt: 0.5, display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <div ref={chatEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: theme.palette.background.paper, borderTop: `1px solid ${theme.palette.divider}`, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Ask GreenBot a question..."
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  sx: { borderRadius: '24px' }
                }}
              />
              <IconButton 
                color="primary" 
                onClick={handleSend}
                disabled={!inputVal.trim()}
                sx={{ 
                  bgcolor: theme.palette.primary.main, 
                  color: 'white',
                  width: 54,
                  height: 54,
                  '&:hover': { bgcolor: theme.palette.primary.dark },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' }
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HelpPage;
