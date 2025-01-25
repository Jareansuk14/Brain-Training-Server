const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MindMap = require('../models/MindMap');

// Get or create mind map for a user
router.get('/:nationalId', async (req, res) => {
  try {
    console.log('Fetching mindmap for nationalId:', req.params.nationalId);
    
    let mindMap = await MindMap.findOne({ nationalId: req.params.nationalId });
    
    if (!mindMap) {
      // Create new mindmap with default root node
      const rootNode = {
        _id: new mongoose.Types.ObjectId(),
        content: 'หัวข้อหลัก',
        children: [],
        isExpanded: true
      };

      mindMap = new MindMap({
        nationalId: req.params.nationalId,
        root: rootNode
      });

      await mindMap.save();
      console.log('Created new mindmap:', mindMap);
    }

    res.json({
      success: true,
      root: mindMap.root
    });
  } catch (error) {
    console.error('Error in GET /:nationalId:', error);
    // Send more specific error message
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Mind Map'
    });
  }
});

// Add new node
router.post('/add-node', async (req, res) => {
  try {
    const { nationalId, parentId, content = 'หัวข้อใหม่' } = req.body;
    console.log('Adding node:', { nationalId, parentId, content });

    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบข้อมูล Mind Map'
      });
    }

    const newNode = mindMap.addNode(parentId, content);
    if (!newNode) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบ node ที่ต้องการเพิ่มข้อมูล'
      });
    }

    await mindMap.save();
    console.log('Added new node:', newNode);

    res.json({
      success: true,
      _id: newNode._id,
      content: newNode.content,
      children: [],
      isExpanded: true
    });
  } catch (error) {
    console.error('Error in POST /add-node:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการเพิ่ม node'
    });
  }
});

// Update node
router.post('/update-node', async (req, res) => {
  try {
    const { nationalId, nodeId, content } = req.body;
    console.log('Updating node:', { nationalId, nodeId, content });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบข้อมูล Mind Map'
      });
    }

    const updated = mindMap.updateNode(nodeId, { content });
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบ node ที่ต้องการแก้ไข'
      });
    }

    await mindMap.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /update-node:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการแก้ไข node'
    });
  }
});

// Delete node
router.post('/delete-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;
    console.log('Deleting node:', { nationalId, nodeId });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบข้อมูล Mind Map'
      });
    }

    const deleted = mindMap.deleteNode(nodeId);
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบ node ที่ต้องการลบหรือไม่สามารถลบได้'
      });
    }

    await mindMap.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /delete-node:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการลบ node'
    });
  }
});

// Toggle node expansion
router.post('/toggle-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;
    console.log('Toggling node:', { nationalId, nodeId });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบข้อมูล Mind Map'
      });
    }

    const { node } = mindMap.findNodeById(nodeId);
    if (!node) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบ node ที่ต้องการ'
      });
    }

    node.isExpanded = !node.isExpanded;
    await mindMap.save();

    res.json({ 
      success: true,
      isExpanded: node.isExpanded
    });
  } catch (error) {
    console.error('Error in POST /toggle-node:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะการแสดงผล'
    });
  }
});

module.exports = router;