# Hybrid Rebuttal Planner

A comprehensive web application designed to help researchers write structured and effective conference rebuttals through a guided questionnaire approach. This tool is inspired by **Devi Parikh's guide "How we write rebuttals"** and follows the systematic approach outlined in her blog post.

## 🌐 Live Demo

**[Try the tool here: https://rahulvigneswaran.github.io/research_paper_rebuttal_questionnaire/](https://rahulvigneswaran.github.io/research_paper_rebuttal_questionnaire/)**

## 🌟 Features

### Multiple Rebuttal Management
- **Create** multiple rebuttal questionnaires
- **Switch** between rebuttals using a dropdown selector
- **Rename** rebuttals by changing the paper title
- **Delete** rebuttals that are no longer needed
- **Import/Export** functionality for backup and sharing

### Structured Questionnaire Sections

1. **Logistics & Constraints** - Track paper details, deadlines, and reviewer information
2. **Extract Strengths & Framing** - Identify positive feedback and core messages
3. **Decompose Reviewer Criticisms** - Break down individual reviewer comments into atomic items
4. **Consolidate Overlapping Issues** - Merge similar concerns across reviewers
5. **Prioritize & Order Responses** - Rank and organize your responses
6. **Draft Opening & Structure** - Craft your rebuttal opening and structure
7. **Final Assembly** - Assemble the complete rebuttal text
8. **Confidential/AC-only Notes** - Document any unfair or erroneous comments
9. **Quality Check** - Verify completeness with a comprehensive checklist

### Interactive Features
- ✅ **Progress tracking** - See how many questions you've answered
- 💾 **Auto-save** - Your work is automatically saved every 30 seconds
- 📥 **Export options** - Download as PDF, Markdown, or JSON
- 📤 **Import functionality** - Restore from previously exported JSON files
- 🔄 **Dynamic forms** - Add/remove reviewer comments and consolidated concerns as needed

## 🚀 Getting Started

### Local Development

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start filling out your rebuttal!

No build process or server required - this is a client-side only application.

### Usage

1. **Create a new rebuttal** by clicking the "+ New" button
2. **Fill in your paper title** to name your rebuttal
3. **Navigate through sections** using the tabs at the top
4. **Add reviewer comments** and **consolidated concerns** as needed
5. **Save your progress** manually or rely on auto-save
6. **Export** your completed rebuttal in your preferred format

## 💾 Data Storage

- All data is stored locally in your browser's `localStorage`
- No data is sent to any server
- **Important:** Export your work regularly for backup!
- Clearing browser data will delete your rebuttals

## 📤 Export Formats

### JSON
- Full data backup including all answers and metadata
- Can be re-imported later
- Useful for archiving and version control

### Markdown
- Human-readable format
- Easy to edit in any text editor
- Can be converted to other formats (PDF, DOCX, etc.)

## 🎯 Based On

This tool is inspired by:
- **"How we write rebuttals"** by Devi Parikh ([Medium article](https://deviparikh.medium.com/how-we-write-rebuttals-dc84742fece1))
- **Research Paper Planner** by Anubhav Shrimal ([GitHub](https://github.com/anubhavshrimal/research-paper-planner))

## 📋 Question Structure

The questionnaire follows Devi Parikh's systematic approach:

1. **Start with logistics** - Understand constraints (length, deadline, number of reviewers)
2. **Extract strengths** - Note what reviewers liked
3. **Decompose criticisms** - Break each concern into atomic items
4. **Consolidate concerns** - Group overlapping issues
5. **Prioritize responses** - Focus on what matters most
6. **Draft strategically** - Structure your rebuttal effectively
7. **Quality check** - Ensure completeness

## 🛠️ Technical Details

- **Pure HTML/CSS/JavaScript** - No frameworks or dependencies
- **Responsive design** - Works on desktop and mobile
- **localStorage API** - For data persistence
- **File API** - For import/export functionality

## 📱 Browser Compatibility

Works in all modern browsers that support:
- localStorage
- ES6 JavaScript
- File API

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## 🤝 Contributing

This is an open tool for the research community. Feel free to:
- Fork and customize for your needs
- Submit issues or feature requests
- Share with colleagues

## 📄 License

This project is provided as-is for academic and research purposes.

## 🙏 Acknowledgments

- **Devi Parikh** - For the excellent guide on writing rebuttals
- **Anubhav Shrimal** - For the Research Paper Planner that inspired this tool's structure
- The research community for providing feedback and guidance

## 💡 Tips for Using This Tool

1. **Start early** - Don't wait until the last minute
2. **Be thorough** - Answer all questions completely
3. **Export regularly** - Save backups as you work
4. **Collaborate** - Share exported files with co-authors
5. **Iterate** - Revise and refine your responses
6. **Stay organized** - Use the sections to structure your thinking

## 🔗 Related Resources

- [Devi Parikh's Blog on Rebuttals](https://deviparikh.medium.com/how-we-write-rebuttals-dc84742fece1)
- [Research Paper Planner](https://anubhavshrimal.github.io/research-paper-planner/)

---

**Happy rebuttal writing! 📝✨**
