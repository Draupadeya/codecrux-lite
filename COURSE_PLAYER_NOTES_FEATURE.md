# Course Player Notes & Summarization Feature

## Overview
The course player now includes:
- **AI-powered module summaries** using Mistral API
- **Interactive notes section** that updates when selecting modules
- **Download feature** to export course notes as a text file

## Features

### 1. Module Summaries
When you click on a module in the curriculum:
- The notes section automatically generates a concise summary of the module
- Summaries include key concepts, learning objectives, and practical applications
- The summary is powered by Mistral AI for accurate, contextual content

### 2. Notes Display
The notes section (right panel) now shows:
- Module title
- Duration of the module
- AI-generated summary
- Clean, readable formatting suitable for studying

### 3. Download Notes
- Click the "📥 Download Notes" button to save the current module's notes
- Downloads as a `.txt` file with the course title as the filename
- All notes are saved locally on your computer

## Setup Instructions

### Backend Setup (Django)

1. **Install Mistral API dependency**:
   ```bash
   pip install requests
   ```

2. **Set Mistral API environment variables**:
   ```bash
   export MISTRAL_API_KEY="your-mistral-api-key"
   export MISTRAL_MODEL="mistral-small-latest"  # or another available model
   export MISTRAL_API_URL="https://api.mistral.ai/v1/chat/completions"
   ```

3. **Or add to your `.env` file**:
   ```
   MISTRAL_API_KEY=your-mistral-api-key
   MISTRAL_MODEL=mistral-small-latest
   MISTRAL_API_URL=https://api.mistral.ai/v1/chat/completions
   ```

4. **The endpoint is already configured**:
   - New endpoint: `/studymate/api/summarize-content/`
   - Method: POST
   - Body: `{ "content": "text to summarize" }`
   - Returns: `{ "summary": "generated summary" }`

### Frontend Integration

The frontend already includes:
- `summarizeWithMistral()` function that calls the backend endpoint
- Module click handlers that generate summaries on demand
- `downloadNotes()` function for exporting notes

## How to Use

### For Students:
1. Open a course and click "Continue Learning"
2. The course player loads with your curriculum modules
3. Click any module in the left sidebar
4. A summary automatically appears in the Notes section
5. Click "📥 Download Notes" to save the current notes

### For Developers:
The summarization is handled entirely by the backend:

```python
# In views.py, the summarize_content view:
@csrf_exempt
def summarize_content(request):
    """Summarize module content using Mistral API."""
    data = json.loads(request.body)
    content = data.get('content', '')
    summary = _mistral_chat(prompt, temperature=0.3, max_tokens=300)
    return JsonResponse({"summary": summary})
```

## API Configuration

### Mistral Models Available:
- `mistral-small-latest` - Fast, cost-effective (default)
- `mistral-medium-latest` - Balanced performance
- `mistral-large-latest` - Most capable

### Customizing Summaries:
Edit the prompt in `summarize_content()` function to adjust:
- Summary length (max_tokens parameter)
- Temperature (0.3 = deterministic, 0.7 = creative)
- Focus areas (modify the prompt template)

## Troubleshooting

### "Unable to generate summary" error:
1. Check that `MISTRAL_API_KEY` is set
2. Verify API key is valid at https://console.mistral.ai
3. Ensure network connectivity to mistral.ai
4. Check Django logs for detailed error messages

### "Summary unavailable" in Notes section:
1. Check browser console for errors (F12 → Console tab)
2. Verify backend is running and accessible
3. Check network tab to see if API call is being made
4. Review Django server logs

### Download button not working:
- Ensure pop-ups are not blocked by browser
- Try a different browser if issue persists
- Check browser console for JavaScript errors

## Files Modified

1. **`frontend/index.html`**:
   - Added `summarizeWithMistral()` function
   - Added `downloadNotes()` function
   - Updated notes panel UI
   - Added click handlers to modules for summaries

2. **`video_proctoring_project/proctoring/studymate/views.py`**:
   - Added `summarize_content()` view function

3. **`video_proctoring_project/proctoring/studymate/urls.py`**:
   - Added `/api/summarize-content/` route

## Future Enhancements

- Save notes to course progress
- Support multiple summarization styles (bullet points, narrative, etc.)
- Export as PDF or Word documents
- Collaborative notes with other students
- Note search and tagging functionality
