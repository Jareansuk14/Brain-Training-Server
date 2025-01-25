const express = require('express');
const router = express.Router();
const {
  MindMap,
  createMindMapWithRoot,
  getMindMapTree,
  addNode,
  updateNode,
  deleteNode,
  toggleNode
} = require('../models/MindMap');

// Get mind map
router.get('/:nationalId', async (req, res) => {
  try {
    const { nationalId } = req.params;
    
    // หา mindmap ที่มีอยู่หรือสร้างใหม่
    let mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      const result = await createMindMapWithRoot(nationalId);
      mindMap = result.mindMap;
    }

    // ดึงข้อมูล tree
    const tree = await getMindMapTree(mindMap._id);
    
    res.json({
      success: true,
      root: tree.root
    });
  } catch (error) {
    console.error('Error in GET /:nationalId:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Add new node
router.post('/add-node', async (req, res) => {
  try {
    const { nationalId, parentId, content } = req.body;

    // หา mindmap
    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mind map not found' 
      });
    }

    // เพิ่ม node ใหม่
    const newNode = await addNode(mindMap._id, parentId, content);
    
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
      error: error.message 
    });
  }
});

// Update node
router.post('/update-node', async (req, res) => {
  try {
    const { nationalId, nodeId, content } = req.body;

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mind map not found' 
      });
    }

    const updatedNode = await updateNode(mindMap._id, nodeId, content);
    
    res.json({
      success: true,
      node: updatedNode
    });
  } catch (error) {
    console.error('Error in POST /update-node:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete node
router.post('/delete-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mind map not found' 
      });
    }

    await deleteNode(mindMap._id, nodeId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /delete-node:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Toggle node
router.post('/toggle-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mind map not found' 
      });
    }

    const node = await toggleNode(mindMap._id, nodeId);
    
    res.json({
      success: true,
      isExpanded: node.isExpanded
    });
  } catch (error) {
    console.error('Error in POST /toggle-node:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;