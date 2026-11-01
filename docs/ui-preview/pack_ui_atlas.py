"""最终图集 ui_atlas：MaxRects，padding 2 + extrude 1（与 docs/ui-art-integration.md §0.6 一致），≤512×512；帧名=切片文件名去 .png。"""
from PIL import Image;import json,os,rectpack
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);os.makedirs('atlas',exist_ok=True)
sp=json.load(open('slices.json'));ims={n:Image.open(f'slices/{n}.png').convert('RGBA') for n in sp}
PAD,EX,W=2,1,512
p=rectpack.newPacker(rotation=False,pack_algo=rectpack.MaxRectsBl,sort_algo=rectpack.SORT_AREA)
for n,i in ims.items(): p.add_rect(i.width+2*EX+PAD,i.height+2*EX+PAD,n)
p.add_bin(W+PAD,W+PAD);p.pack()
rs=p.rect_list();assert len(rs)==len(sp),f'放不下：{len(rs)}/{len(sp)}'
at=Image.new('RGBA',(W,W),(0,0,0,0));frames={}
for _,x,y,w,h,n in rs:
    i=ims[n];fx,fy=x+EX,y+EX
    # extrude 1：边缘像素外扩 1px
    ext=Image.new('RGBA',(i.width+2,i.height+2));ext.paste(i,(1,1))
    ext.paste(i.crop((0,0,i.width,1)),(1,0));ext.paste(i.crop((0,i.height-1,i.width,i.height)),(1,i.height+1))
    ext.paste(ext.crop((1,0,2,i.height+2)),(0,0));ext.paste(ext.crop((i.width,0,i.width+1,i.height+2)),(i.width+1,0))
    at.paste(ext,(x,y));frames[n]={'frame':{'x':fx,'y':fy,'w':i.width,'h':i.height},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':i.width,'h':i.height},'sourceSize':{'w':i.width,'h':i.height}}
hmax=max(f['frame']['y']+f['frame']['h']+EX for f in frames.values());Hh=512 if hmax>256 else 256
at=at.crop((0,0,W,Hh))
at.save('atlas/ui_atlas.png',optimize=True);at.save('atlas/ui_atlas.webp',lossless=True,quality=100,method=6,exact=True);at.save('atlas/ui_atlas_q90.webp',quality=90,alpha_quality=95,method=6)
json.dump({'frames':dict(sorted(frames.items())),'meta':{'app':'card-legend art/ui-plan pack_ui_atlas.py','image':'ui_atlas.png','format':'RGBA8888','size':{'w':W,'h':Hh},'scale':'1','padding':PAD,'extrude':EX}},open('atlas/ui_atlas.json','w'),indent=1)
# 自检：按 json 裁帧逐像素比对
bad=[n for n,f in frames.items() if Image.open('atlas/ui_atlas.png').convert('RGBA').crop((f['frame']['x'],f['frame']['y'],f['frame']['x']+f['frame']['w'],f['frame']['y']+f['frame']['h'])).tobytes()!=ims[n].tobytes()]
wb=Image.open('atlas/ui_atlas.webp').convert('RGBA').tobytes()==at.tobytes()
sz=lambda f:os.path.getsize('atlas/'+f)
print(len(frames),'frames',W,Hh,'png',sz('ui_atlas.png'),'webp_lossless',sz('ui_atlas.webp'),'q90',sz('ui_atlas_q90.webp'),'json',sz('ui_atlas.json'),'mismatch',bad,'webp==png',wb,'used_h',hmax)
