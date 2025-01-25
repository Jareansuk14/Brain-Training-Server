const express = require('express');
const router = express.Router();
const { MindMap, Node } = require('../models/MindMap');

// Get mind map
router.get('/:nationalId', async (req, res) => {
  try {
    const { nationalId } = req.params;
    console.log('Fetching mindmap for:', nationalId);

    let mindMap = await MindMap.findOne({ nationalId });
    
    if (!mindMap) {
      console.log('Creating new mindmap for:', nationalId);
      mindMap = await MindMap.createWithRoot(nationalId);
    }

    const tree = await mindMap.getFullTree();
    console.log('Returning tree structure:', tree);
    
    res.json({
      _id: mindMap._id,
      nationalId: mindMap.nationalId,
      root: tree
    });
  } catch (error) {
    console.error('Error in GET /:nationalId:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Add new node
router.post('/add-node', async (req, res) => {
  try {
    const { nationalId, parentId, content } = req.body;
    console.log('Adding node:', { nationalId, parentId, content });

    const mindMap = await MindMap.findOne({ nationalId });
    if (!mindMap) {
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const newNode = await mindMap.addNode(parentId, content);
    console.log('Created new node:', newNode);

    // Convert to the expected format
    const nodeData = {
      _id: newNode._id,
      content: newNode.content,
      isExpanded: newNode.isExpanded,
      children: []
    };

    res.json(nodeData);
  } catch (error) {
    console.error('Error in POST /add-node:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      return res.status(404).json({ error: 'Mind map not found' });
    }

    const updatedNode = await mindMap.updateNode(nodeId, content);
    console.log('Updated node:', updatedNode);

    res.json({ 
      success: true, 
      node: {
        _id: updatedNode._id,
        content: updatedNode.content,
        isExpanded: updatedNode.isExpanded
      }
    });
  } catch (error) {
    console.error('Error in POST /update-node:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
      return res.status(404).json({ error: 'Mind map not found' });
    }

    await mindMap.deleteNode(nodeId);
    console.log('Successfully deleted node and its children');

    res.json({ success: true });
  } catch (error) {
    console.error('Error in POST /delete-node:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Toggle node expansion
router.post('/toggle-node', async (req, res) => {
  try {
    const { nationalId, nodeId } = req.body;
    console.log('Toggling node:', { nationalId, nodeId });

    const node = await Node.findById(nodeId);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    node.isExpanded = !node.isExpanded;
    await node.save();

    res.json({ 
      success: true, 
      isExpanded: node.isExpanded 
    });
  } catch (error) {
    console.error('Error in POST /toggle-node:', error);
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;