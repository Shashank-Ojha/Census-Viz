function getStateData(year, race){
	// $.get( "ajax/query/state/"+year+"/"+race, function( data ) {

	// })

	$.ajax({
		url: "query/state/"+year+"/"+race,
	})
	.done(function(data){
		console.log(data);
	});
	//ajax for /state/year/race
}

getStateData("1970", "B18AA");