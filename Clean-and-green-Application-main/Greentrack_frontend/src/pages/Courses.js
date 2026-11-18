import React, { useState, useEffect, useMemo } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import { useTheme, Box, Typography, Card, CardContent, Button, TextField, Chip, Grid } from "@mui/material";
import { getUser } from "../utils/safeStorage";
import { BACKEND_URL as API_BASE } from "../config";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarsIcon from '@mui/icons-material/Stars';

const Courses = () => {
  const navigate = useNavigate();  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const user = useMemo(() => getUser(), []);

  const [completedCourseIds, setCompletedCourseIds] = useState([]);
  const [loading, setLoading] = useState(true);

  const courses = [
    {
      id: 1,
      title: "Basics of Recycling",
      reward: "10 Eco-Coins",
      rewardValue: 10,
      level: "Easy",
      category: "Recycling",
      image: "https://5.imimg.com/data5/SELLER/Default/2023/11/359547724/DQ/UZ/UB/15590/solid-waste-management-500x500.jpg",
      path: "/recycling-course",
    },
    {
      id: 2,
      title: "Waste Management at Home",
      reward: "15 Eco-Coins",
      rewardValue: 15,
      level: "Easy",
      category: "Waste Management",
      image: "https://static.vecteezy.com/system/resources/thumbnails/025/472/349/small/ecology-and-world-water-day-light-bulb-idia-with-environmental-protection-and-save-earth-water-ai-generated-photo.jpg",
      path:"/waste-management",
    },
    {
      id: 3,
      title: "Energy Conservation Techniques",
      reward: "15 Eco-Coins",
      rewardValue: 15,
      level: "Easy",
      category: "Energy",
      image: "https://static.vecteezy.com/system/resources/thumbnails/025/472/349/small/ecology-and-world-water-day-light-bulb-idia-with-environmental-protection-and-save-earth-water-ai-generated-photo.jpg",
      path:"/energy-conservation",
    },
    {
      id: 4,
      title: "Sustainable Living Practices",
      reward: "20 Eco-Coins",
      rewardValue: 20,
      level: "Easy",
      category: "Sustainability",
      image: "https://static.vecteezy.com/system/resources/thumbnails/025/472/349/small/ecology-and-world-water-day-light-bulb-idia-with-environmental-protection-and-save-earth-water-ai-generated-photo.jpg",
      path:"/sustainable-living",
    },
    {
      id: 5,
      title: "Carbon Footprint Reduction",
      reward: "20 Eco-Coins",
      rewardValue: 20,
      level: "Intermediate",
      category: "Climate",
      image: "https://t3.ftcdn.net/jpg/13/80/83/72/360_F_1380837253_rIw9xEFgR9cnCmNn58nJleFG78GZ0HvQ.jpg",
      path:"/carbon-footprint-course",
    },
    {
      id: 6,
      title: "Eco-Friendly Agriculture",
      reward: "20 Eco-Coins",
      rewardValue: 20,
      level: "Intermediate",
      category: "Agriculture",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAgPk3DXMumtqEPhdrZhZdh0HWjlIY99z8Qw&s",
      path:"/eco-friendly-agriculture",
    },
    {
      id: 7,
      title: "Environmental Awareness for Students",
      reward: "25 Eco-Coins",
      rewardValue: 25,
      level: "Intermediate",
      category: "Education",
      image: "https://t3.ftcdn.net/jpg/03/23/82/94/360_F_323829465_RIB5fhIFOv5G2CAlBJ5lpsabhQlRVBbn.jpg",
      path:"/environmental-awareness",
    },
    {
      id: 8,
      title: "E-Waste Awareness",
      reward: "30 Eco-Coins",
      rewardValue: 30,
      level: "Advanced",
      category: "Electronics",
      image: "https://t3.ftcdn.net/jpg/05/68/96/18/360_F_568961895_MN1FE24wtBvcgxml8rTCbJcKYmxu9bhH.jpg",
      path:"/e-waste-awareness",
    },
    {
      id: 9,
      title: "Green Technology Innovations",
      reward: "30 Eco-Coins",
      rewardValue: 30,
      level: "Advanced",
      category: "Technology",
      image: "https://res.cloudinary.com/jerrick/image/upload/v1685644405/6478e475863a49001cfe055e.jpg",
      path:"/green-tech-innovations",
    },
  ];

  useEffect(() => {
    if (user) {
      fetchCompletions();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCompletions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/courses/user/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setCompletedCourseIds(data);
      }
    } catch (err) {
      console.error("Error fetching completions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Logic for recommended course: The first uncompleted course that is related to a completed one, or just the next uncompleted one.
  const recommendedCourse = useMemo(() => {
    if (completedCourseIds.length === 0) return courses[0];
    
    // Find uncompleted courses
    const uncompleted = courses.filter(c => !completedCourseIds.includes(c.id));
    if (uncompleted.length === 0) return null;

    // Try to find one in the same category as the last completed one
    const lastCompletedId = completedCourseIds[completedCourseIds.length - 1];
    const lastCompleted = courses.find(c => c.id === lastCompletedId);
    
    if (lastCompleted) {
        const sameCategory = uncompleted.find(c => c.category === lastCompleted.category);
        if (sameCategory) return sameCategory;
    }

    // Default to the next one in list
    return uncompleted[0];
  }, [completedCourseIds, courses]);

  const handleEnroll = (path) => {
    navigate(path);
  };
  
  const [comments, setComments] = useState([]);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const addComment = () => {
    if (name.trim() && comment.trim()) {
      setComments([...comments, { name, text: comment }]);
      setName("");
      setComment("");
    }
  };

  const clearComments = () => {
    setComments([]);
  };

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, color: theme.palette.text.primary, minHeight: '100vh', transition: 'all 0.5s ease', pb: 5 }}>
      {/* Hero Section */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          color: 'white',
          backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://static.vecteezy.com/system/resources/thumbnails/025/472/349/small/ecology-and-world-water-day-light-bulb-idia-with-environmental-protection-and-save-earth-water-ai-generated-photo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "80vh",
          px: 3
        }}
      >
        <Typography variant="h2" sx={{ fontWeight: 'bold', mb: 3 }}>
          Explore Courses in Clean and Green Technology
        </Typography>
        <Typography variant="h5" sx={{ maxWidth: '800px', mx: 'auto', opacity: 0.9 }}>
          Learn to Recycle, Earn Eco-Coins & Save the Planet!  
          Start your green learning journey and earn green-Coins as you create a real-world impact.
        </Typography>
      </Box>

      {/* Why Learn Section */}
      <Box sx={{ my: 8, px: { xs: 3, md: 10 } }}>
        <div className="row align-items-center">
          <div className="col-md-8">
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main, mb: 3 }}>Why Learn About Recycling?</Typography>
            <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Recycling gives materials a new life and helps reduce pollution
              and conserve energy. It’s one of the easiest ways you can help our
              planet every day!
            </Typography>
            <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
              By reusing and recycling, you can reduce waste, save resources,
              and make a big difference. Join the global effort to build a
              sustainable future through clean technology awareness.
            </Typography>
            <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Every action counts — so when you recycle plastic, paper, or
              metal, you’re preserving natural habitats, saving water, and
              reducing harmful greenhouse gas emissions.
            </Typography>
            <Typography sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Recycling isn’t just impactful — it’s rewarding! Learn how to turn
              waste into treasure while earning Eco-Coins for every course you
              complete. Let’s create a cleaner, greener future together.
            </Typography>
          </div>
          <div className="col-md-4 text-center mt-4 mt-md-0">
            <img
              src="https://t3.ftcdn.net/jpg/05/81/60/08/360_F_581600829_FELbYAM9N9ubKyHjrWmt9jG4yNJOynFb.jpg"
              alt="Recycling"
              className="img-fluid rounded shadow-lg"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </Box>

      {/* Recommended Course Section */}
      {recommendedCourse && !loading && (
        <Box sx={{ px: { xs: 3, md: 10 }, mb: 8 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
            <StarsIcon color="secondary" /> Recommended for You
          </Typography>
          <Card sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            bgcolor: isDark ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.05)',
            border: `1px dashed ${theme.palette.primary.main}`,
            borderRadius: '24px',
            overflow: 'hidden'
          }}>
            <Box sx={{ width: { xs: '100%', md: '40%' }, height: { xs: '200px', md: 'auto' } }}>
              <img src={recommendedCourse.image} alt={recommendedCourse.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
            <CardContent sx={{ flex: 1, p: 4 }}>
                <Chip label={recommendedCourse.level} size="small" color="primary" sx={{ mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>{recommendedCourse.title}</Typography>
                <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                    Continue your green journey by learning about {recommendedCourse.category.toLowerCase()}.
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>Reward: {recommendedCourse.reward}</Typography>
                </Box>
                <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => handleEnroll(recommendedCourse.path)}
                    sx={{ bgcolor: theme.palette.primary.main, px: 6, borderRadius: '12px', fontWeight: 'bold' }}
                >
                    Start Now
                </Button>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Courses Section */}
      <Box sx={{ px: { xs: 3, md: 10 }, mb: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', textAlign: 'center', mb: 5, color: theme.palette.primary.main }}>Available Courses</Typography>
        <Grid container spacing={4}>
          {courses.map((course) => {
            const isCompleted = completedCourseIds.includes(course.id);
            return (
              <Grid item key={course.id} xs={12} sm={6} md={4}>
                <Card sx={{ 
                    height: '100%', 
                    bgcolor: theme.palette.background.paper, 
                    boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.1)', 
                    borderRadius: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'transform 0.3s ease',
                    '&:hover': { transform: 'translateY(-8px)' }
                }}>
                  {isCompleted && (
                    <Box sx={{
                        position: 'absolute',
                        top: 15,
                        right: 15,
                        zIndex: 2,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        borderRadius: '50%',
                        p: 0.5,
                        display: 'flex',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}>
                        <CheckCircleIcon color="success" />
                    </Box>
                  )}
                  <img
                    src={course.image}
                    className="card-img-top"
                    alt={course.title}
                    style={{ height: "200px", objectFit: "cover", opacity: isCompleted ? 0.7 : 1 }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: theme.palette.text.primary, lineHeight: 1.2 }}>{course.title}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                      Reward: {course.reward} | Level: {course.level}
                    </Typography>
                    {isCompleted ? (
                        <Button
                          variant="outlined"
                          fullWidth
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleEnroll(course.path)}
                          sx={{ 
                            borderColor: theme.palette.success.main, 
                            color: theme.palette.success.main, 
                            fontWeight: 'bold', 
                            py: 1.2,
                            borderRadius: '12px'
                          }}
                        >
                          Completed (View Results)
                        </Button>
                    ) : (
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleEnroll(course.path)}
                          sx={{ 
                            bgcolor: theme.palette.primary.main, 
                            '&:hover': { bgcolor: theme.palette.secondary.main }, 
                            color: '#fff', 
                            fontWeight: 'bold', 
                            py: 1.2,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                          }}
                        >
                          Enroll Now
                        </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      {/* Comment Section */}
      <Box
        sx={{
          bgcolor: isDark ? 'rgba(67, 160, 71, 0.1)' : '#d8f3dc',
          maxWidth: "800px",
          mx: "auto",
          p: 4,
          borderRadius: "20px",
          mb: 8,
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : 'none'
        }}
      >
        <Typography variant="h5" sx={{ textAlign: "center", mb: 4, fontWeight: "bold", color: theme.palette.text.primary }}>User Comments</Typography>
        <Box sx={{ mb: 3 }}>
          <TextField
             fullWidth
             label="Your Name"
             variant="outlined"
             value={name}
             onChange={(e) => setName(e.target.value)}
             sx={{ mb: 2 }}
          />
          <TextField
             fullWidth
             label="Your Comment"
             variant="outlined"
             multiline
             rows={3}
             value={comment}
             placeholder="Share your thoughts on recycling..."
             onChange={(e) => setComment(e.target.value)}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button variant="contained" sx={{ bgcolor: theme.palette.primary.main, color: '#fff' }} onClick={addComment}>
            Post Comment
          </Button>
          <Button variant="outlined" color="error" onClick={clearComments}>
            Clear All
          </Button>
        </Box>

        <ul className="list-group list-group-flush mt-3" style={{ backgroundColor: 'transparent' }}>
          {comments.map((c, index) => (
            <li key={index} className="list-group-item" style={{ backgroundColor: 'transparent', color: theme.palette.text.primary, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
              <strong style={{ color: theme.palette.primary.main }}>{c.name}:</strong> {c.text}
            </li>
          ))}
          {comments.length === 0 && (
            <li className="list-group-item text-center" style={{ backgroundColor: 'transparent', color: theme.palette.text.secondary, border: 'none' }}>
              No comments yet. Be the first to share your views!
            </li>
          )}
        </ul>
      </Box>

      {/* Footer */}
      <footer className="text-center py-4">
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          About Us | Contact | Privacy | Terms
          <br /><br />
          <i className="fab fa-facebook mx-3 fs-5"></i>
          <i className="fab fa-twitter mx-3 fs-5"></i>
          <i className="fab fa-instagram mx-3 fs-5"></i>
        </Typography>
      </footer>
    </Box>
  );
};
export default Courses;
