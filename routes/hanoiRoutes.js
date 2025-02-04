// routes/hanoiRoutes.js
import express from 'express';
import HanoiResult from '../models/HanoiResult.js';

const router = express.Router();

// บันทึกผลการเล่น
router.post('/save-result', async (req, res) => {
  try {
    const { nationalId, level, moves, time } = req.body;
    
    const result = new HanoiResult({
      nationalId,
      level,
      moves,
      time
    });

    await result.save();

    // ดึงผลการเล่นครั้งก่อนมาเปรียบเทียบ
    const previousResult = await HanoiResult.findOne({
      nationalId,
      level,
      timestamp: { $lt: result.timestamp }
    }).sort({ timestamp: -1 });

    if (!previousResult) {
      return res.json({
        success: true,
        message: 'บันทึกผลการเล่นสำเร็จ',
        comparison: null // ไม่มีข้อมูลเปรียบเทียบ
      });
    }

    // คำนวณการเปรียบเทียบ
    const comparison = {
      moves: {
        difference: previousResult.moves - moves,
        improved: moves < previousResult.moves
      },
      time: {
        difference: previousResult.time - time,
        improved: time < previousResult.time
      }
    };

    res.json({
      success: true,
      message: 'บันทึกผลการเล่นสำเร็จ',
      comparison
    });

  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการบันทึกผล'
    });
  }
});

// ดึงผลการเล่นล่าสุดของแต่ละระดับ
router.get('/latest-results/:nationalId', async (req, res) => {
  try {
    const { nationalId } = req.params;
    
    // ดึงผลการเล่นล่าสุดของแต่ละระดับ
    const latestResults = await Promise.all(
      Array.from({ length: 6 }, async (_, i) => {
        const level = i + 1;
        const result = await HanoiResult.findOne({
          nationalId,
          level
        }).sort({ timestamp: -1 });
        
        return { level, result };
      })
    );

    res.json({
      success: true,
      results: latestResults
    });

  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล'
    });
  }
});

export default router;