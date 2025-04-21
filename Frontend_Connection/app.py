import os
from flask import Flask, request, render_template, redirect, url_for, flash, jsonify
from werkzeug.utils import secure_filename
import shutil

# Import functions from your existing modules
from populate_database import load_documents, split_documents, add_to_chroma, clear_database
from query_data import query_rag

app = Flask(__name__, static_folder='static')
app.secret_key = "ragappsecretkey"
app.config['UPLOAD_FOLDER'] = 'data'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB limit
ALLOWED_EXTENSIONS = {'pdf'}

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Home route
@app.route('/')
def home():
    # Get list of currently loaded documents
    documents = []
    if os.path.exists(app.config['UPLOAD_FOLDER']):
        documents = [f for f in os.listdir(app.config['UPLOAD_FOLDER']) if f.endswith('.pdf')]
    return render_template('index.html', documents=documents)

# Route for document upload
@app.route('/upload', methods=['POST'])
def upload_document():
    # Check if a file was uploaded
    if 'file' not in request.files:
        flash('No file part')
        return redirect(url_for('home'))
    
    file = request.files['file']
    
    # If user doesn't select a file
    if file.filename == '':
        flash('No file selected')
        return redirect(url_for('home'))
    
    if file and allowed_file(file.filename):
        # Create upload folder if it doesn't exist
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        
        # Save the file
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        try:
            # Process the newly uploaded document
            documents = load_documents()
            chunks = split_documents(documents)
            add_to_chroma(chunks)
            flash(f'Medical document {filename} uploaded and processed successfully!')
        except Exception as e:
            flash(f'Error processing medical document: {str(e)}')
        
        return redirect(url_for('home'))
    
    flash('Invalid file type. Only PDF files are allowed.')
    return redirect(url_for('home'))

# Route for resetting the database
@app.route('/reset', methods=['POST'])
def reset_db():
    try:
        clear_database()
        flash('Medical database has been reset successfully!')
    except Exception as e:
        flash(f'Error resetting database: {str(e)}')
    return redirect(url_for('home'))

# Route for structured medical queries
@app.route('/api/medical-query', methods=['POST'])
def medical_query():
    data = request.json
    query_type = data.get('queryType', '')
    symptoms = data.get('symptoms', '')
    patient_details = data.get('patientDetails', '')
    
    if not symptoms and not patient_details:
        return jsonify({'error': 'Please provide patient symptoms or details'})
    
    try:
        # Format the query based on query type
        if query_type == 'disease':
            formatted_query = f"""
Based on the uploaded medical resources, identify the possible disease(s) with the following symptoms and patient details:
Symptoms: {symptoms}
Patient Details: {patient_details}
Please list the most likely conditions in order of probability, with brief explanations for each.
"""
        elif query_type == 'recovery':
            formatted_query = f"""
Based on the uploaded medical resources, estimate the recovery time for a patient with the following details:
Symptoms: {symptoms}
Patient Details: {patient_details}
Please provide a range of expected recovery times, factors that might affect recovery, and any relevant medical guidelines.
"""
        elif query_type == 'resources':
            formatted_query = f"""
Based on the uploaded medical resources, identify the required medical resources, treatments, and specialists needed for a patient with:
Symptoms: {symptoms}
Patient Details: {patient_details}
Please provide a detailed list of medications, equipment, specialized care, and healthcare professionals that would be needed.
"""
        else:
            formatted_query = f"""
Based on the uploaded medical resources, analyze the following patient information:
Symptoms: {symptoms}
Patient Details: {patient_details}
Please provide a comprehensive analysis including possible conditions, recommended treatments, and required medical resources.
"""
            
        # Query the RAG system with the formatted prompt
        result = query_rag(formatted_query)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': f"Error processing medical query: {str(e)}"})

# General query route (keeping for compatibility)
@app.route('/api/query', methods=['POST'])
def api_query():
    data = request.json
    query_text = data.get('query', '')
    
    if not query_text:
        return jsonify({'error': 'No query provided'})
    
    try:
        # Add a prefix to guide the response format
        enhanced_query = f"""
Based on the medical documents in the database, please analyze the following query:
{query_text}

Your analysis should include:
1. Potential disease identification
2. Estimated recovery time
3. Required medical resources for treatment

Please be detailed and specific.
"""
        result = query_rag(enhanced_query)
        return jsonify({'result': result})
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)