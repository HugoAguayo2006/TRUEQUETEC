from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserModel, ItemModel, SwipeModel
from app.schemas import UserCreate, UserResponse, ItemCreate, ItemResponse, SwipeRequest

router = APIRouter()

@router.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserModel(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/items/", response_model=ItemResponse)
def create_item(item: ItemCreate, db: Session = Depends(get_db)):
    db_item = ItemModel(owner_id=item.owner_id, title=item.title, estimated_value=item.estimated_value)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/swipes/")
def swipe_item(swipe: SwipeRequest, db: Session = Depends(get_db)):
    db_swipe = SwipeModel(swiper_id=swipe.swiper_id, item_id=swipe.item_id, direction=swipe.direction)
    db.add(db_swipe)
    db.commit()
    
    if swipe.direction == "dislike":
        return {"match": False, "message": "Dislike tracked successfully."}
        
    target_item = db.query(ItemModel).filter(ItemModel.id == swipe.item_id).first()
    if not target_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    receiver_id = target_item.owner_id
    
    mutual_swipe = db.query(SwipeModel).join(ItemModel, SwipeModel.item_id == ItemModel.id).\
        filter(
            SwipeModel.swiper_id == receiver_id,
            SwipeModel.direction == "like",
            ItemModel.owner_id == swipe.swiper_id
        ).first()
        
    if mutual_swipe:
        return {"match": True, "message": "It's a Match! Both users like each other's items."} 
    return {"match": False, "message": "Swipe tracked. Waiting for a match."}
