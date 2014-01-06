#!../bin/gamecake

--local bjs=require("wetgenes.bake.js")

local require=require
local loadfile=loadfile
local setfenv=setfenv
local pcall=pcall
local print=print
local pairs=pairs
local ipairs=ipairs
local type=type

local string=string
local table=table
local io=io
local os=os


local wstr=require("wetgenes.string")
local wjson=require("wetgenes.json")

local bake=require("wetgenes.bake")
local pp=require("wetgenes.pp")
local lfs=require("lfs")

function build(arg)

local no_art=false

local opts=arg.opts or {} -- can pass in an opts of default options

local opts_changed=false
local func

	opts.VERSION_NUMBER=opts.VERSION_NUMBER or 0

	func=loadfile("src/opts.lua")
	if func then
		setfenv(func,opts)
		pcall(func)
	else
		opts_changed=true
	end
		
	for i=1,#arg do
		
		if arg[i]=="bump" then
		
			opts.VERSION_NUMBER=opts.VERSION_NUMBER+0.001
		
			opts_changed=true
		end
		
		if arg[i]=="debug" then
		
			opts.VERSION_BUILD="debug"
		
			opts_changed=true
		end
		
		if arg[i]=="release" then
		
			opts.VERSION_BUILD="release"
		
			opts_changed=true
		end
		
		if arg[i]=="noart" then
			no_art=true
		end
		
	end
	
	if opts_changed then -- write out changed file
		local fp=io.open("src/opts.lua","w")
		for i,v in pairs(opts) do
		
			if type(v)=="number" then
				fp:write(i.."="..v.."\n")
			elseif type(v)=="string" then
				fp:write(i.."="..string.format("%q",v).."\n")
			end
		end
		fp:close()
	end
	
	
	
	
-- where we are building from
bake.cd_base	=	bake.cd_base or bake.get_cd()

-- where we are building to
bake.cd_out		=	bake.cd_out or 'out'

lfs.mkdir(bake.cd_out)
lfs.mkdir(bake.cd_out..'/art')
lfs.mkdir(bake.cd_out..'/cache')





-- go up a dir from base cd and remember as main CD for building commands

bake.set_cd(bake.get_cd()..'/..')
bake.cd=bake.get_cd()

print('cd','=',bake.cd)


bake.cmd.java="java" -- needed for minifier
bake.cmd.zip="zip" -- needed to zip stuffs

bake.cmd.lua		=	bake.path_clean_exe( bake.cd , '/exe/lua' )

if bake.osflavour=="nix" then -- expected to be installed...
--	bake.cmd.mtasc="mtasc"
--	bake.cmd.swfmill="swfmill"
end


bake.set_cd(bake.cd_base)

bake.files_min_js=bake.files_min_js or {}
bake.files_min_js[ #bake.files_min_js + 1 ]=arg.name

bake.files_js={}
for v in lfs.dir("src") do -- add all .js files in the src dir
	if string.find(v,"%.js$") then
		v=string.gsub( v , "%.js$" , "")
		table.insert(bake.files_js,v)
	end
end

bake.files_css={}
for v in lfs.dir("src") do -- add all .css files in the src dir
	if string.find(v,"%.css$") then
		v=string.gsub( v , "%.css$" , "")
		table.insert(bake.files_css,v)
	end
end

bake.files_html={}
for v in lfs.dir("src") do -- and all .html files in the src dir
	if string.find(v,"%.html$") then
		v=string.gsub( v , "%.html$" , "")
		table.insert(bake.files_html,v)
	end
end





for i,v in ipairs(bake.files_js) do
	pp.loadsave( 'src/'..v..'.js' , bake.cd_out..'/'..v..'.js' )
end
for i,v in ipairs(bake.files_css) do
	pp.loadsave( 'src/'..v..'.css' , bake.cd_out..'/'..v..'.css' )
end

for i,v in ipairs(bake.files_html) do
	pp.loadsave( 'src/'..v..'.html' , bake.cd_out..'/'..v..'.html' )
end

-- generic pp of files,full paths from -> to
bake.files_pp=bake.files_pp or {}
for i,v in ipairs(bake.files_pp) do
	pp.loadsave( v[1] , v[2] )
end


io.flush()

if no_art then
print('****')
print('**SKIPPING**ART**BUILD**STEP**')
print('****')
else


arg.compiler=arg.compiler or "../../js/class/compiler.jar" -- where is the closure compiler jar?

for i,v in ipairs(bake.files_min_js) do
print('compressing '..v)
	bake.execute( bake.cd_base , bake.cmd.java ,
"-jar "..arg.compiler.." --js_output_file "..bake.cd_out.."/"..v..".min.js --js "..bake.cd_out.."/"..v..".js")

end

	local r=bake.findfiles{basedir=".",dir="art",filter="%.png$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end

	local r=bake.findfiles{basedir=".",dir="art",filter="%.jpg$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end

	local r=bake.findfiles{basedir=".",dir="art",filter="%.swf$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end

	local r=bake.findfiles{basedir=".",dir="art",filter="%.css$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end

	local r=bake.findfiles{basedir=".",dir="art",filter="%.mp3$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end
	local r=bake.findfiles{basedir=".",dir="art",filter="%.ogg$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end
	local r=bake.findfiles{basedir=".",dir="art",filter="%.wav$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end

	local r=bake.findfiles{basedir=".",dir="jslib",filter="%.js$"}
	for i,v in ipairs(r.ret) do
		bake.create_dir_for_file(bake.cd_out.."/"..v)
		bake.copyfile(v,bake.cd_out.."/"..v)
	end
	
-- build an application cache

	for i,v in ipairs(arg.cache_files or {}) do
		local v1,v2
		if type(v)=="table" then
			v1=v[1]
			v2=v[2]
		else
			v1=v
			v2=v
		end
print('caching out/'..v1.." as "..v2)
		bake.create_dir_for_file(bake.cd_out.."/cache/"..v2)
		bake.copyfile("out/"..v1,bake.cd_out.."/cache/"..v2)
	end

	local r=bake.findfiles{basedir=bake.cd_out.."/cache",dir=".",filter=""}
	local mc=table.concat(r.ret,"\n").."\n"
	local fp=io.open(bake.cd_out.."/cache/cache.manifest","w")
	fp:write("CACHE MANIFEST\n")
	fp:write("#Updated on "..os.date().."\n")
	fp:write(mc)
	fp:close()
	
-- zip everything in the cache, this is our distribution package
	bake.execute(bake.cd_out.."/cache",bake.cmd.zip,"../"..arg.name..".zip * -r")

end


	
end



-----------------------------------------------------------------------------
--
-- take some text and break it into named chunks
-- returns a lookup table of chunks and numerical list of these chunks in the order they where first defined
-- body is the default chunk name
--
-- a chunk is a line that begins with #
-- the part after the # and ending with whitespace is the chunk name
-- all text following this line is part of that chunk
-- the default section if none is give is "body", so any whitespace at the start of the file
-- before the first # line will be assigned to this chunk
-- data may follow this chunk name, if multiple chunks of the same name
-- are defined they are simple merged into one
-- and each #chunk line is combined into one chunk data
--
-- use option=value after the section name to provide options, so somthing like this
--
-- #name opt=val opt=val opt=val
-- # opt=val
-- here is some text
-- # opt=val
-- here is some more text
-- ## special comment, this line is ignored
-- ## comments are just a line that begins with two hashes
--
-- is a valid chunk, all of the opt=val will be assigned to the same chunk
-- and all the other text will be joined as that chunks body
--
-- pass in chunks and you can merge multiple texts into one chunk
--
-----------------------------------------------------------------------------
function text_to_chunks(text,chunks)

local chunkend -- special end of chunk test

	chunks=chunks or {}

	local function manifest_chunk(line,oldchunk)
		local opts=wstr.split_words( line:sub(2) ) -- skip # at start of line
		local name=string.lower( opts[1] or "body" )
		local chunk
		local c2=line:sub(2,2)
				
		if c2:find("%s") then -- if first char after # is whitespace, then use the old chunk 
			chunk=oldchunk
		end
		
		if not chunk then
			chunk=chunks[name] -- do we already have this chunk?
		end
		
		if chunk then -- update an old chunk
		
			for i=1,#opts do local v=opts[i]
				table.insert( chunk.opts , v ) -- add extra opts
				local a,b=wstr.split_equal(v)
				if a then chunk.opts[a]=b end
			end
			
		else -- create a new chunk
		
			chunk={} -- make default chunk

-- set some default options depending on the chunk name

			if name:sub(1,4)=="body" then -- all chunks begining with "body" are waka format by default
				opts.form="waka"
			end

			if name:sub(1,5)=="title" then -- all chunks begining with "title" are trimed by default
				opts.trim="ends"
			end

			if name:sub(1,3)=="css" then -- all chunks begining with "css" append children by default
				opts.append="on"
			end
		
			if name:sub(1,3)=="lua" then -- all chunks begining with "lua" are lua code by default
				opts.form="lua"
			end
			if name:sub(1,4)=="opts" then -- all chunks begining with "opts" are also lua code by default
				opts.form="opts"
			end
			
-- the actual options will overide the defaults

			for i=1,#opts do local v=opts[i]
				local a,b=wstr.split_equal(v)
				if a then opts[a]=b end
			end
			
			chunk.id=#chunks+1
			chunk.name=name
			chunk.opts=opts
			chunk.lines={}
			
			chunks[chunk.id]=chunk		-- save chunk in chunks as numbered id
			chunks[chunk.name]=chunk	-- and as name
		end
		
		return chunk
	end
		
	local lines=wstr.split_lines(text)
	
	local chunk
	
	for i=1,#lines do local v=lines[i] -- ipairs
		
		local c=v:sub(1,1) -- the first char is special
		
		if c=="#" then -- start of chunk
		
			if chunkend then -- waiting for special end everything is inserted
			
				if chunkend==v:sub(1,#chunkend) then -- got it
					chunkend=nil
				else
					if not chunk then chunk=manifest_chunk("#body") end --sanity				
					table.insert(chunk.lines , v)
				end
				
			else

				if "#[["==v:sub(1,3) then -- special open
				
					chunkend="#]]"..v:sub(4) -- any special hash we need to close
				
				elseif v:sub(2,2)~="#" then -- skip all comments

					chunk=manifest_chunk(v,chunk)

				end
				
			end
			
		else -- normal lime add to the current chunk
		
			if not chunk then chunk=manifest_chunk("#body") end --sanity
			
			table.insert(chunk.lines , v)
		end
	
	end
	
	for i=1,#chunks do local v=chunks[i] -- perform some final actions on all chunks
	
		v.text=table.concat(v.lines) -- merge the split lines back together into one string
		
	end
	
	return chunks
	
end


local s=bake.readfile("src/chunks/base.html")

local chunks=text_to_chunks(s)

local dats={}
for i,v in ipairs(chunks) do
	dats[v.name]=v.text
end

bake.writefile("src/ctrack.chunks.js","ctrack.chunks="..wjson.encode(dats)..";\n")

build{

	name="ctrack",
	
	compiler="../bin/compiler.jar",
	
	...
}

bake.execute()



