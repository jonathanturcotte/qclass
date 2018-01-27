#!/usr/bin/env python
import argparse
import random
import string
import uuid
import sys

# Get the command line options
def getCommandArgs():
    parser = argparse.ArgumentParser()
    parser.add_argument("num_students", type=int, help="The number of students to have enrolled in each class", default=300, nargs='?', const=0)
    # parser.add_argument("num_professors", type=int, help="The number of professors to generate", default=10, nargs='?', const=0)
    parser.add_argument("num_courses", type=int, help="The number of classes to generate for each professor", default=5, nargs='?', const=0)
    parser.add_argument("num_sessions", type=int, help="The number of sessions per class to generate", default=15, nargs='?', const=0)
    parser.add_argument("prof_netid", type=str, help="The netID of the professor to add all this to", default="1pvb69", nargs='?', const=0)
    parser.add_argument("output_file", type=str, help="The file to append the new data to", default="../SISystem.sql", nargs='?', const=0)
    return parser.parse_args()

def appendLine(path, line):
    try:
        file = open(path, 'a+')
    except Exception as err:
        print('Error opening file: ' + err.message)
        return False
    try:
        file.write(line)
    except Exception as err:
        print('Error writing lines: ' + err.message)
        file.close()
        return False
    file.close()
    return True

def genRandomNetID(): 
    part1 = ''.join(random.choice(string.digits) for _ in range(random.randint(0,2)))
    part2 = ''.join(random.choice(string.ascii_lowercase) for _ in range(random.randint(2,3)))
    part3 = ''.join(random.choice(string.digits) for _ in range(random.randint(0,2)))
    return part1 + part2 + part3


def genRandomName():
    return ''.join(random.choice(string.ascii_lowercase + string.ascii_uppercase) for _ in range(random.randint(0,99)))

def genRandomNumber():
    return ''.join(random.choice(string.digits) for _ in range(8))

def genRandomCourseCode():
    return ''.join(random.choice(string.digits + string.ascii_uppercase) for _ in range(random.randint(1,30)))

def genRandomCheckinCode():
    return ''.join(random.choice(string.ascii_lowercase) for _ in range(5))

def genRandomUUID():
    return str(uuid.uuid4())

# Generate a random user object
def genRandomUser():
    return {
        'netID': genRandomNetID(),
        'fName': genRandomName(),
        'lName': genRandomName(),
        'stdNum': genRandomNumber()
    }

# Generate a random class object
def genRandomCourse():
    return {
        'cID': genRandomUUID(),
        'cCode': genRandomCourseCode(),
        'cName': genRandomName()
    }

# Generate a random session object
def genRandomSession():
    return {
        'attTime': str(1509398271000 + random.randint(0, 100000)),
        'attDuration': str(60000),
        'checkInCode': genRandomCheckinCode(),
        'completed': '1'
    }

#--------------------------------------------------------------------
# Main
#--------------------------------------------------------------------
users = []
profs = []
studs = []
courses = []
enrollment = []
sessions = []
attendance = []
args = getCommandArgs()

# Generate profs and students
while len(users) < args.num_students: # + args.num_professors:
    u = genRandomUser()
    if not u['netID'] in (d['netID'] for d in users):
        users.append(u)

# profs = users[0:args.num_professors]
# studs = users[args.num_professors:]
studs = users

# Generate the classes for the prof
# for p in profs:
for i in range(args.num_courses):
    c = genRandomCourse()
    c['pNetID'] = args.prof_netid
    courses.append(c)

# Generate the enrollment data
for s in studs:
    for c in courses:
        enrollment.append({ 'netID': s['netID'], 'cID': c['cID'] })

# Generate the session data
for c in courses:
    for i in range(args.num_sessions):
        s = genRandomSession()
        s['cID'] = c['cID']
        sessions.append(s)

# Generate the attendance data
for u in studs:
    for s in sessions:
        attendance.append({ 'attTime': s['attTime'], 'cID': s['cID'], 'netID': u['netID'], 'attended': str(random.randint(0,1)) })

print "Generated " + str(len(studs)) + " students"
# print "Generated " + str(len(profs)) + " professors"
print "Generated " + str(len(courses)) + " courses"
print "Generated " + str(len(enrollment)) + " enrollment rows"
print "Generated " + str(len(sessions)) + " sessions"
print "Generated " + str(len(attendance)) + " attendance rows"

# Write the finished results to the database file
sys.stdout.write("Writing lines to file...")
sys.stdout.flush()
lines = ['\n', 'insert into student values\n']
for s in studs[:-1]:
    lines.append("\t('" + s['netID'] + "', '" + s['fName'] + "', '" + s['lName'] + "', '" + s['stdNum'] + "'),\n")

s = studs[-1]
lines.append("\t('" + s['netID'] + "', '" + s['fName'] + "', '" + s['lName'] + "', '" + s['stdNum'] + "');\n")

# lines.append('\n')
# lines.append('insert into professor values\n')
# for p in profs[:-1]:
#     lines.append("\t('" + p['netID'] + "', '" + p['fName'] + "', '" + p['lName'] + "'),\n")

# p = profs[-1]
# lines.append("\t('" + p['netID'] + "', '" + p['fName'] + "', '" + p['lName'] + "');\n")

lines.append('\n')
lines.append('insert into course values\n')
for c in courses[:-1]:
    lines.append("\t('" + c['cID'] + "', '" + c['cCode'] + "', '" + c['cName'] + "', '" + c['pNetID'] + "'),\n")

c = courses[-1]
lines.append("\t('" + c['cID'] + "', '" + c['cCode'] + "', '" + c['cName'] + "', '" + c['pNetID'] + "');\n")

lines.append('\n')
lines.append('insert into enrolled values\n')
for e in enrollment[:-1]:
    lines.append("\t('" + e['netID'] + "', '" + e['cID'] + "'),\n")

e = enrollment[-1]
lines.append("\t('" + e['netID'] + "', '" + e['cID'] + "');\n")

lines.append('\n')
lines.append('insert into attendanceSession values\n')
for s in sessions[:-1]:
    lines.append("\t('" + s['cID'] + "', '" + s['attTime'] + "', '" + s['attDuration'] + "', '" + s['checkInCode']+ "', '" + s['completed'] + "'),\n")

s = sessions[-1]
lines.append("\t('" + s['cID'] + "', '" + s['attTime'] + "', '" + s['attDuration'] + "', '" + s['checkInCode']+ "', '" + s['completed'] + "');\n")

lines.append('\n')
lines.append('insert into attendance values\n')
for a in attendance[:-1]:
    lines.append("\t('" + a['attTime'] + "', '" + a['cID'] + "', '" + a['netID'] + "', '" + a['attended'] + "'),\n")

a = attendance[-1]
lines.append("\t('" + a['attTime'] + "', '" + a['cID'] + "', '" + a['netID']  + "', '" + a['attended'] + "');\n")

for l in lines:
    appendLine(args.output_file, l)

sys.stdout.write(" Done!\n")