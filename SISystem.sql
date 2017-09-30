drop database if exists SISystem;
create database SISystem;

use SISystem;

create table course (
	cID			int not null AUTO_INCREMENT,
	cCode 		varchar(10) not null,
	cName		varchar(20),
	regNum		char(5) not null,
	defLocation	varchar(30),
	primary key (cID)
);

alter table course AUTO_INCREMENT = 1000;

create table student (
	sNetID		varchar(10) not null,
	fname 		varchar(20) not null,
	lName		varchar(20) not null,
	stdNum		char(8) not null,
	primary key (sNetID)
);

create table professor (
	pNetID		varchar(10) not null,
	fname 		varchar(20) not null,
	lName		varchar(20) not null,
	primary key (pNetID)
);

create table enrolled (
	sNetID		varchar(10) not null,
	cID			int not null,
	primary key (sNetID, cID)
);
	
create table teaches (
	pNetID		varchar(10) not null,
	cID			int not null,
	primary key (pNetID, cID)
);

create table lecture (
	lecNum		int not null,
	cID			int not null,
	sTime 		datetime not null,
	eTime		datetime not null,
	location	varchar(30),
	lFlag		tinyint(1),
	primary key (lecNum, cID)
);

create table attendance (
	cID		int not null,
	lecNum 	int not null,
	sNetID 	varchar(10) not null,
	primary key (cID, lecNum, sNetID)
);

create table question (
	qNum		int not null,
	lecNum		int not null,
	cID 		int not null,
	qtext		varchar(280),
	ans			int not null,
	qFlag		tinyint(1),
	primary key (qNum, lecNum, cID)
);

create table solution (
	sNum		int not null,
	qNum		int not null,
	lecNum		int not null,
	cID			int not null,
	sText		varchar(140),
	primary key	(sNum, qNum, lecNum, cID)
);

create table response (
	sNetID		varchar(10),
	qNum		int not null,
	lecNum		int not null,
	cID			int not null,
	resp		int not null,
	correct		tinyint(1),
	primary key (qNum, lecNum, cID, sNetID)
);
	
	
