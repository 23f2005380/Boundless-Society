import json
import re

# Raw multiline data (you can paste the whole text here)
raw_data = """
Prateek Singh	23f1003014@ds.study.iitm.ac.in	CORE/2025/001
Ishan Raj	23f2001683@ds.study.iitm.ac.in	CORE/2025/002
Sakshi Verma	24f1000404@ds.study.iitm.ac.in	CORE/2025/003
Kanika Chauhan	23f3004257@ds.study.iitm.ac.in	CORE/2025/004
Vivek Subramani	23f2000790@ds.study.iitm.ac.in	CORE/2025/005
Greeshma Suresh	23f3000638@ds.study.iitm.ac.in	CORE/2025/006
Harshit Mishra	23f3002282@ds.study.iitm.ac.in	CORE/2025/007
Rishikesh Gupta	23f3003940@ds.study.iitm.ac.in	CORE/2025/008
Sahil Kamble 	24f2002622@ds.study.iitm.ac.in	CORE/2025/009
Saurav Kumar Pal	23f3002941@ds.study.iitm.ac.in	RES/2025/001
Aaryan Sahu	24f2001366@ds.study.iitm.ac.in	RES/2025/002
Sparsh Gupta	24f3005110@ds.study.iitm.ac.in	RES/2025/003
Prasun kumar	24f1000525@ds.study.iitm.ac.in	PR/2025/001
Sohan Kambale	23f3001563@ds.study.iitm.ac.in	PR/2025/002
Saurav Kumar Pal	23f3002941@ds.study.iitm.ac.in	PR/2025/003
Vishnu Maddheshiya	24f1000199@ds.study.iitm.ac.in	PR/2025/004
Sahil Kamble 	24f2002622@ds.study.iitm.ac.in	PR/2025/005
Ridhi Sehgal	24f2008371@ds.study.iitm.ac.in	MEDIA/2025/001
Aditya Raj	23f3001748@ds.study.iitm.ac.in	MEDIA/2025/002
Sahil Kamble 	24f2002622@ds.study.iitm.ac.in	MEDIA/2025/003
Alok Chaubey	24f2006338@ds.study.iitm.ac.in	MEDIA/2025/004
Utsav Shah	24f2002780@ds.study.iitm.ac.in	MEDIA/2025/005
Poornima  N N 	23f1000468@ds.study.iitm.ac.in	MEDIA/2025/006
Bilal Shakeel	24f2005920@ds.study.iitm.ac.in	MEDIA/2025/007
Mohd Anas	23f3003127@ds.study.iitm.ac.in	MEDIA/2025/008
Vidhi Belani	24f1001294@ds.study.iitm.ac.in	DOC/2025/001
Somya Kumari	24f2007578@ds.study.iitm.ac.in	DOC/2025/002
Shraddha Dubey 	24f1000774@ds.study.iitm.ac.in	FC/2025/001
Nithyashree DN 	24f3001893@ds.study.iitm.ac.in	FC/2025/002
Shristi Choudhary	25f1001464@ds.study.iitm.ac.in	FC/2025/003
Sahil Kamble	24f2002622@ds.study.iitm.ac.in	TRIP/2025/001
Bhavya Jain	24f2001138@ds.study.iitm.ac.in	TRIP/2025/002
Bhumi Narwade	24f3003173@ds.study.iitm.ac.in	TRIP/2025/003
Abhishek Pathak	24f2001885@ds.study.iitm.ac.in	TRIP/2025/004
Somya Kumari	24f2007578@ds.study.iitm.ac.in	TRIP/2025/005
Aaryan Sahu 	24f2001366@ds.study.iitm.ac.in	TRIP/2025/006
Satyam Pandey	23f3002874@ds.study.iitm.ac.in	TRIP/2025/007
Ankaj Kumar 	23f2003179@ds.study.iitm.ac.in	TRIP/2025/008
Adwait Keshari	23f2000979@ds.study.iitm.ac.in	CITY/2025/001
Sarthak Sharma	23f3004414@ds.study.iitm.ac.in	CITY/2025/002
Vishnu Maddheshiya	24f1000199@ds.study.iitm.ac.in	CITY/2025/003
Ankush Singh Tomar	24f2003852@ds.study.iitm.ac.in	CITY/2025/004
Madhusudan Jat	23f3000553@es.study.iitm.ac.in
	CITY/2025/005
Satyam Pandey
	23f3002874@ds.study.iitm.ac.in	CITY/2025/006
Sahil Kamble	24f2002622@ds.study.iitm.ac.in	CITY/2025/008
Ananay Kumar Purvey	23f2004980@ds.study.iitm.ac.in	CITY/2025/009
Bittu Kumar	23f3000443@es.study.iitm.ac.in	CITY/2025/010
Manish kumar	24f3004852@ds.study.iitm.ac.in	CITY/2025/011
Nikhil Kumar	23f3002351@ds.study.iitm.ac.in	CITY/2025/012
Surendra Prajapat	22f1001907@ds.study.iitm.ac.in	CITY/2025/013
Suhani saxena	24f2009236@ds.study.iitm.ac.in	CITY/2025/014
Shubham Kalosiya	23f2002766@ds.study.iitm.ac.in	CITY/2025/015
Deeksha Jain 	23f1000573@ds.study.iitm.ac.in	CITY/2025/017
Pragati Tomar	23f2002233@ds.study.iitm.ac.in	CITY/2025/018
Urvashi Jain	23f3003282@ds.study.iitm.ac.in	CITY/2025/019
Joyce Mallik 	23f2001747@ds.study.iitm.ac.in	COA/2025/001
Yash Pandey	24f3003084@ds.study.iitm.ac.in	COA/2025/002
Ridhi Sehgal	24f2008371@ds.study.iitm.ac.in	COA/2025/003
Durgesh Sharma	24F2002056@ds.study.iitm.ac.in	COA/2025/004
Hariom Dhage	24f1001935@ds.study.iitm.ac.in	COA/2025/005
Twisha Shriyam	24f2009162@ds.study.iitm.ac.in	COA/2025/006
Vishal Nirala	24f2002159@ds.study.iitm.ac.in	COA/2025/007
Urvashi Jain	23f3003282@ds.study.iitm.ac.in	COA/2025/008
Govind Vaishnav	23f2004719@ds.study.iitm.ac.in	COA/2025/009
Ankit Prajapati	23f2003243@ds.study.iitm.ac.in	COA/2025/010
Ankush Sharma	24f2001710@ds.study.iitm.ac.in	COA/2025/011
Shreshta Singh	24f2003742@ds.study.iitm.ac.in	COA/2025/012
Aryan Goyal	24f3000984@ds.study.iitm.ac.in	COA/2025/013
Anant Tripathi	23f2004723@ds.srudy.iitm.ac.in	COA/2025/014
Bilal Shakeel	24f2005920@ds.study.iitm.ac.in	COA/2025/015
Jay Pandey	24f2004591@ds.study.iitm.ac.in	COA/2025/016
Amit Roy	24f2009311@ds.study.iitm.ac.in	COA/2025/017
Yashvardhan Singh Tomar	23f2003408@ds.study.iitm.ac.in	COA/2025/018
"""  


lines = raw_data.strip().split("\n")

certificate_data = {}

for line in lines:
    
    parts = re.split(r"\t+", line.strip())
    if len(parts) != 3:
        continue  

    name, email, cert_id = parts

    cert_id_sanitized = cert_id.strip().replace("/", "_")
    if not cert_id_sanitized:
        continue

    certificate_data[cert_id_sanitized] = {
        "name": name.strip(),
        "email": email.strip()
    }


with open("certificate.json", "w", encoding="utf-8") as f:
    json.dump(certificate_data, f, indent=2)

print(f"✅ certificate.json generated with {len(certificate_data)} valid entries.")
