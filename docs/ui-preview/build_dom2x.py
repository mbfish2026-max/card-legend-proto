"""手机 DOM（MobileHud CSS border-image）用单图：1x 原图 + @2x（LANCZOS 2× 放大 + 轻锐化；非重绘）。"""
from PIL import Image,ImageFilter;import json,os,shutil
H=os.path.dirname(os.path.abspath(__file__));os.chdir(H);sp=json.load(open('slices.json'))
DOM=['btn_normal','btn_hover','btn_pressed','btn_disabled','btn_close','bar_frame','bar_fill_hp','bar_fill_mp','bar_fill_exp','touch_round','panel_frame_s','tooltip_frame','dialog_frame','list_row','list_row_sel','tab_on','tab_off','lingfu_entry']
os.makedirs('dom/2x',exist_ok=True);[os.remove(f'dom/{f}') for f in os.listdir('dom') if f.endswith('.png')];css=[];tot1=tot2=0
for n in DOM:
    i=Image.open(f'slices/{n}.png').convert('RGBA')
    # 预乘 alpha 防止透明边缘出黑边
    big=i.resize((i.width*2,i.height*2),Image.LANCZOS)
    big=Image.merge('RGBA',(*big.convert('RGB').filter(ImageFilter.UnsharpMask(1.2,60,2)).split(),big.split()[3]))
    big.save(f'dom/2x/{n}@2x.png',optimize=True);tot1+=os.path.getsize(f'slices/{n}.png');tot2+=os.path.getsize(f'dom/2x/{n}@2x.png')
    v=sp[n];v['dom']=True
print(len(DOM),tot1,tot2)
json.dump(sp,open('slices.json','w'),ensure_ascii=False,indent=1)
