from flask import Flask, request
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from pydantic import BaseModel, ValidationError
from openai import OpenAI
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
client = OpenAI()

app = Flask(__name__)

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

class ContractDetails(BaseModel):
    licensor: str
    contract_start_date: str
    raw_contract_details: str

@app.route('/upload-contract', methods=['POST'])
def upload_contract():
    file = request.files['contract']
    filename = secure_filename(file.filename)
    if filename.endswith('.pdf'):
        text = extract_text_from_pdf(file)
        details = extract_details_with_gpt_chat(text)
        try:
            contract_details = ContractDetails(**details)
            # Insert contract_details into your database here
            return {"message": "Contract uploaded successfully"}, 200
        except ValidationError as e:
            return {"errors": e.errors(), "message": "Data validation failed"}, 400
    else:
        return {"message": "Invalid file format. Please upload a PDF."}, 400

def extract_text_from_pdf(file):
    reader = PdfReader(file.stream)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def extract_details_with_gpt_chat(text):
    prompt = f"Extract the licensor name and contract start date from the following contract text and return the data in JSON format:\n\n{text}"
    completion = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[
            {"role": "system", "content": "You are a legal bot assistant tasked with extracting contract details."},
            {"role": "user", "content": prompt}
        ],
        response_format={ "type": "json_object" }
    )

    response_text = completion.choices[0].message['content']

    return response_text

if __name__ == '__main__':
    app.run(debug=True)
