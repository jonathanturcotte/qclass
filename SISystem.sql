drop database if exists SISystem;
create database SISystem;

use SISystem;

create table course (
	cID			char(36) not null,
	cCode 		varchar(30) not null,
	cName		varchar(100),
	pNetID		varchar(10) not null,
	primary key (cID)
);

create table student (
	sNetID		varchar(10) not null,
	fName 		varchar(100),
	lName		varchar(100),
	stdNum		char(8),
	primary key (sNetID)
);

create table professor (
	pNetID		varchar(10) not null,
	fName 		varchar(100) not null,
	lName		varchar(100) not null,
	primary key (pNetID)
);

create table enrolled (
	sNetID		varchar(10) not null,
	cID			char(36) not null,
	primary key (sNetID, cID)
);

create table attendanceSession (
	cID			char(36) not null,
	attTime 	bigint not null,
	attDuration	int not null,
	checkInCode	char(5) not null,
	completed	bool not null default 0,
	primary key (cID, attTime)
);

create table attendance (
	attTime 	bigint not null,
	cID			char(36) not null,
	sNetID 		varchar(10) not null,
    attended	bool not null default 0,
	primary key (cID, attTime, sNetID)
);

create table administrators (
	cID    char(36) not null,
	pNetID varchar(10) not null,
	primary key (cID, pNetID)
);

/*
create table lecture (
	lecNum		int not null,
	cID			char(36) not null,
	sTime 		datetime not null,
	eTime		datetime not null,
	location	varchar(30),
	lFlag		tinyint(1),
	primary key (lecNum, cID)
);

create table question (
	qNum		int not null,
	lecNum		int not null,
	cID 		char(36) not null,
	qtext		varchar(280),
	ans			int not null,
	qFlag		tinyint(1),
	primary key (qNum, lecNum, cID)
);

create table solution (
	sNum		int not null,
	qNum		int not null,
	lecNum		int not null,
	cID			char(36) not null,
	sText		varchar(140),
	primary key	(sNum, qNum, lecNum, cID)
);

create table response (
	sNetID		varchar(10),
	qNum		int not null,
	lecNum		int not null,
	cID			char(36) not null,
	resp		int not null,
	correct		tinyint(1),
	primary key (qNum, lecNum, cID, sNetID)
);
*/
	
insert into course values 
	( 'abc49eb2-0630-4382-98b5-abcfd40627b8', 'ELEC 498', 'Design Course', '1pvb69'),
	( 'dad49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 223', 'Macroeconomic Theory II', '1pvb69'),
	( 'dda49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 322', 'Macroeconomic Theory III', '1pvb69'),	 
	( 'bdd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 224', 'Macroeconomic Theory IV', '1pvb69'),
	( 'ddb49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 330', 'Macroeconomic Theory VI', '1pvb69'),	
	( 'cdd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 340', 'Macroeconomic Theory VII', '1pvb69'),
	( 'dcd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 350', 'Macroeconomic Theory VIII', '1pvb69'),
	( 'ddc49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 370', 'Macroeconomic Theory IX', '1pvb69'),
	( 'edd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 390', 'Macroeconomic Theory X', '1pvb69'),
	( 'dfd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 400', 'Macroeconomic Theory XI', '1pvb69'),
	( 'you49eb2-0630-4382-98b5-wutfd40627b8', 'ECON 360', 'Labour Economics', '15jc3'),
	( 'ree49eb2-0630-4382-98b5-reefd40627b8', 'ECON 255', 'Math Econ', '10boo3'),
	( 'boo49eb2-0630-4382-98b5-moofd40627b8', 'ECON 101', 'Intro to Economic Theory', '12hdm'),
	( 'add49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 222', 'Macroeconomic Theory I', '12hdm'),
	( 'dbd49eb2-0630-4382-98b5-lolfd40627b8', 'ECON 320', 'Macroeconomic Theory II', '12hdm');	 

insert into student values
	( '12cjd2', 'Curtis', 'Demerah', '10090510'),
	( '12ozs', 'Omar', 'Sandarusi', '10097124'),
	( '11jlt10', 'Jonathan', 'Turcotte', '10060060'),
	( '12jlt4', 'Jonny', 'Turks', '10050020'),
	( '11mas5', 'Mario', 'Sandson', '12050030'),
	( '11ktd3', 'Kurtis', 'Demaris', '10134050'),
	( '1jot4', 'Nathan', 'Cotte', '1304060'),
	( '3gow5', 'Georgia', 'Wayne', '20040050'),
	( '4nis6', 'Nate', 'Spurling', '30040050'),
	( '9cps5', 'Cornelius', 'Smith', '55566677'),
	( '6vb6', 'Vere', 'Bean', '40066690'),	
	( '7hhm', 'Hadassah', 'Moore', '80090050'),
	( '6ssd8', 'Stuart', 'Donalds', '33344490'),
	( '5mmb9', 'Moshe', 'Beridze', '29056030'),
	( '6grr', 'Grace', 'Rome', '90040050'),
	( '7ddb67', 'Donald', 'Boone', '11122233'),
	( '8clr', 'Claudia', 'Rakes', '86077795'),
	( '6har6', 'Harriett', 'Rupertson', '99988877'),	
	( '7kas90', 'Kathie', 'Session', '20406090'),
	( '1thv6', 'Thom', 'Vance', '40440440');

insert into  professor values
	('1pvb69', 'Patrick', 'Van Blunt'),
	('10yfl1', 'Yan-Fei', 'Liu'),
	('15jc3', 'John', 'Cena'),
	('10boo3', 'Bob', 'Orwell'),
	('12hdm', 'Harold', 'McMaster');
	
insert into enrolled values 	
	('12cjd2', 'abc49eb2-0630-4382-98b5-abcfd40627b8'),
	('12ozs', 'abc49eb2-0630-4382-98b5-abcfd40627b8'),
	('11jlt10', 'abc49eb2-0630-4382-98b5-abcfd40627b8'),
	('12cjd2', 'you49eb2-0630-4382-98b5-wutfd40627b8'),
	('12ozs', 'ree49eb2-0630-4382-98b5-reefd40627b8'),

	( '12cjd2', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '12ozs', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '11jlt10', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '12jlt4', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '11mas5', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '11ktd3', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '1jot4', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '3gow5', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '4nis6', 'add49eb2-0630-4382-98b5-lolfd40627b8'),
	( '9cps5', 'add49eb2-0630-4382-98b5-lolfd40627b8'), 

	( '6vb6', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),	
	( '7hhm', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '6ssd8', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '5mmb9', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '6grr', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '7ddb67', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '8clr', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '6har6', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),	
	( '7kas90', 'dbd49eb2-0630-4382-98b5-lolfd40627b8'),
	( '1thv6', 'dbd49eb2-0630-4382-98b5-lolfd40627b8');

insert into attendanceSession values 
	('abc49eb2-0630-4382-98b5-abcfd40627b8', '1509398271000', '60000', 'afeeo', '1'),
    ('abc49eb2-0630-4382-98b5-abcfd40627b8', '1509398272000', '3600000','typeo', '1'),

	('add49eb2-0630-4382-98b5-lolfd40627b8', '1518214568000', '60000','neooo', '1'),
	('add49eb2-0630-4382-98b5-lolfd40627b8', '1518300968000', '3600000','sojni', '1'),	
	('add49eb2-0630-4382-98b5-lolfd40627b8', '1518387368000', '60000','qwert', '1'),

	('dbd49eb2-0630-4382-98b5-lolfd40627b8', '1518473768000', '60000','lolno', '1'),
	('dbd49eb2-0630-4382-98b5-lolfd40627b8', '1518560168000', '3600000','yespl', '1'),
	('dbd49eb2-0630-4382-98b5-lolfd40627b8', '1518646568000', '60000','someb', '1');

    

insert into attendance values 
	( '1509398271000', 'abc49eb2-0630-4382-98b5-abcfd40627b8', '12ozs', 1),
	( '1509398271000', 'abc49eb2-0630-4382-98b5-abcfd40627b8', '12cjd2', 1),
	( '1509398272000', 'abc49eb2-0630-4382-98b5-abcfd40627b8', '11jlt10', 0),
	( '1509398272000', 'abc49eb2-0630-4382-98b5-abcfd40627b8', '12ozs', 0),
    ( '1509398272000', 'abc49eb2-0630-4382-98b5-abcfd40627b8', '12cjd2', 1),

	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12cjd2', 0),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12ozs', 0),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11jlt10', 0),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12jlt4', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11mas5', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11ktd3', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '1jot4', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '3gow5', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '4nis6', 1),
	( '1518214568000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '9cps5', 1), 
		
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12cjd2', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12ozs', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11jlt10', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12jlt4', 0),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11mas5', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11ktd3', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '1jot4', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '3gow5', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '4nis6', 1),
	( '1518300968000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '9cps5', 1), 

	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12cjd2', 1),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12ozs', 1),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11jlt10', 1),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '12jlt4', 0),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11mas5', 0),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '11ktd3', 0),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '1jot4', 0),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '3gow5', 1),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '4nis6', 1),
	( '1518387368000', 'add49eb2-0630-4382-98b5-lolfd40627b8', '9cps5', 0), 


	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6vb6', 1 ),	
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8',  '7hhm', 0),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6ssd8', 1),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '5mmb9', 0),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6grr', 1),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7ddb67', 0),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '8clr', 1),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6har6', 0),	
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7kas90', 1),
	( '1518473768000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '1thv6', 0),

	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6vb6', 0),	
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8',  '7hhm', 1),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6ssd8', 1),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '5mmb9', 0),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6grr', 1),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7ddb67', 0),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '8clr', 1),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6har6', 1),	
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7kas90', 1),
	( '1518560168000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '1thv6', 1),

	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6vb6', 1 ),	
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8',  '7hhm', 0),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6ssd8', 1),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '5mmb9', 0),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6grr', 1),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7ddb67', 0),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '8clr', 1),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '6har6', 0),	
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '7kas90', 1),
	( '1518646568000', 'dbd49eb2-0630-4382-98b5-lolfd40627b8', '1thv6', 0);
    
insert into administrators values
	('abc49eb2-0630-4382-98b5-abcfd40627b8', '12hdm'),
    ('abc49eb2-0630-4382-98b5-abcfd40627b8', '13asd');


/*
insert into lecture values
	('1', 'abc49eb2-0630-4382-98b5-abcfd40627b8','2017-10-16 08:30:00', '2017-10-16 09:30:00'),
	('2', 'abc49eb2-0630-4382-98b5-abcfd40627b8','2017-10-18 10:30:00', '2017-10-18 11:30:00'),
	('3', 'abc49eb2-0630-4382-98b5-abcfd40627b8','2017-10-20 14:30:00', '2017-10-20 15:30:00'),
	('1', 'ddd49eb2-0630-4382-98b5-lolfd40627b8','2017-10-19 15:30:00', '2017-10-19 16:30:00'),
	('2', 'ddd49eb2-0630-4382-98b5-lolfd40627b8',  ),
	('1',),
	('1',);
*/